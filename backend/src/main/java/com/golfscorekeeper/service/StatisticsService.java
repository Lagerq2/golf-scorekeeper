package com.golfscorekeeper.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Calculates personal performance data from completed scorecards without mutating stored rounds. */
@Service
public class StatisticsService {
    private final GolfDatabase db;
    private final ObjectMapper mapper;

    public StatisticsService(GolfDatabase db, ObjectMapper mapper) {
        this.db = db;
        this.mapper = mapper;
    }

    public ObjectNode playerStatistics(String playerId) {
        List<RoundResult> results = results(playerId, null);
        ObjectNode response = aggregate(results);
        response.put("playerId", playerId);
        response.set("trend", trend(results));
        response.set("insights", insights(results, response));
        response.set("courses", courseStatistics(playerId));
        return response;
    }

    public ArrayNode courseStatistics(String playerId) {
        ArrayNode output = mapper.createArrayNode();
        for (JsonNode course : db.all("courses")) {
            List<RoundResult> results = results(playerId, course.path("id").asText());
            if (results.isEmpty()) continue;
            ObjectNode item = aggregate(results);
            item.put("courseId", course.path("id").asText());
            item.put("courseName", course.path("name").asText());
            item.set("holes", holeStatistics(results));
            output.add(item);
        }
        return output;
    }

    private List<RoundResult> results(String playerId, String courseId) {
        Map<String, JsonNode> courses = new HashMap<>();
        db.all("courses").forEach(course -> courses.put(course.path("id").asText(), course));
        List<RoundResult> results = new ArrayList<>();
        for (JsonNode round : db.rounds("completed", playerId, courseId)) {
            JsonNode course = courses.get(round.path("courseId").asText());
            if (course == null) continue;
            for (JsonNode player : round.path("players")) {
                if (!playerId.equals(player.path("playerId").asText())) continue;
                RoundResult result = new RoundResult(round, course);
                for (JsonNode hole : course.path("holes")) {
                    int number = hole.path("holeNumber").asInt();
                    JsonNode score = player.path("holeScores").path(String.valueOf(number));
                    int strokes = score.path("strokes").asInt();
                    if (strokes <= 0) continue;
                    int par = hole.path("par").asInt(4);
                    result.holes++;
                    result.score += strokes;
                    result.par += par;
                    result.putts += score.path("putts").asInt();
                    result.penalties += score.path("penalties").asInt();
                    result.bunkerShots += score.path("bunkerShots").asInt(score.path("sandSave").asBoolean() ? 1 : 0);
                    result.parStrokes.merge(par, strokes, Integer::sum);
                    result.parHoles.merge(par, 1, Integer::sum);
                    if (par >= 4 && !"na".equals(score.path("fairwayHit").asText("pending"))
                            && !"pending".equals(score.path("fairwayHit").asText("pending"))) {
                        result.fairways++;
                        if ("hit".equals(score.path("fairwayHit").asText())) result.fairwaysHit++;
                    }
                    result.greens++;
                    if (score.path("greenInRegulation").asBoolean()) result.greensHit++;
                    result.holeScores.computeIfAbsent(number, ignored -> new int[3]);
                    result.holeScores.get(number)[0] += strokes;
                    result.holeScores.get(number)[1] += par;
                    result.holeScores.get(number)[2]++;
                }
                if (result.holes > 0) results.add(result);
            }
        }
        results.sort(Comparator.comparing(r -> r.date));
        return results;
    }

    private ObjectNode aggregate(List<RoundResult> results) {
        ObjectNode out = mapper.createObjectNode();
        int rounds = results.size();
        int strokes = results.stream().mapToInt(r -> r.score).sum();
        int par = results.stream().mapToInt(r -> r.par).sum();
        int holes = results.stream().mapToInt(r -> r.holes).sum();
        int putts = results.stream().mapToInt(r -> r.putts).sum();
        int penalties = results.stream().mapToInt(r -> r.penalties).sum();
        int bunkers = results.stream().mapToInt(r -> r.bunkerShots).sum();
        int fairways = results.stream().mapToInt(r -> r.fairways).sum();
        int fairwaysHit = results.stream().mapToInt(r -> r.fairwaysHit).sum();
        int greens = results.stream().mapToInt(r -> r.greens).sum();
        int greensHit = results.stream().mapToInt(r -> r.greensHit).sum();
        out.put("roundsPlayed", rounds);
        out.put("holesPlayed", holes);
        putNullable(out, "averageScore", rounds == 0 ? null : (double) strokes / rounds);
        putNullable(out, "averageToPar", rounds == 0 ? null : (double) (strokes - par) / rounds);
        putNullable(out, "bestScore", results.stream().filter(r -> r.holes == r.round.path("holesPlayed").asInt()).mapToInt(r -> r.score).min().stream().boxed().findFirst().orElse(null));
        putNullable(out, "averagePuttsPerRound", rounds == 0 ? null : (double) putts / rounds);
        putNullable(out, "puttsPerHole", holes == 0 ? null : (double) putts / holes);
        putNullable(out, "fairwayPct", fairways == 0 ? null : 100d * fairwaysHit / fairways);
        putNullable(out, "girPct", greens == 0 ? null : 100d * greensHit / greens);
        putNullable(out, "averagePenalties", rounds == 0 ? null : (double) penalties / rounds);
        putNullable(out, "averageBunkerShots", rounds == 0 ? null : (double) bunkers / rounds);
        ObjectNode byPar = out.putObject("byPar");
        for (int p = 3; p <= 5; p++) {
            int type = p;
            int count = results.stream().mapToInt(r -> r.parHoles.getOrDefault(type, 0)).sum();
            int typeStrokes = results.stream().mapToInt(r -> r.parStrokes.getOrDefault(type, 0)).sum();
            ObjectNode metric = byPar.putObject(String.valueOf(p));
            metric.put("holes", count);
            putNullable(metric, "average", count == 0 ? null : (double) typeStrokes / count);
            putNullable(metric, "averageToPar", count == 0 ? null : (double) typeStrokes / count - p);
        }
        return out;
    }

    private ArrayNode trend(List<RoundResult> results) {
        ArrayNode trend = mapper.createArrayNode();
        results.stream().skip(Math.max(0, results.size() - 10)).forEach(r -> trend.addObject()
                .put("roundId", r.round.path("id").asText()).put("date", r.date)
                .put("courseName", r.round.path("courseName").asText())
                .put("score", r.score).put("toPar", r.score - r.par)
                .put("putts", r.putts)
                .put("fairwayPct", r.fairways == 0 ? 0 : round(100d * r.fairwaysHit / r.fairways))
                .put("girPct", r.greens == 0 ? 0 : round(100d * r.greensHit / r.greens)));
        return trend;
    }

    private ArrayNode insights(List<RoundResult> results, ObjectNode stats) {
        ArrayNode insights = mapper.createArrayNode();
        if (results.size() < 3) return insights;
        double putts = stats.path("puttsPerHole").asDouble();
        double gir = stats.path("girPct").asDouble();
        double penalties = stats.path("averagePenalties").asDouble();
        if (putts >= 2.1) addInsight(insights, "putting", "Putting is costing shots", "You average " + round(putts) + " putts per hole. Distance control and short-putt practice may offer the quickest gain.", "practice");
        if (gir < 35) addInsight(insights, "approach", "Create more birdie chances", "You hit " + Math.round(gir) + "% of greens in regulation. Prioritize approach accuracy and reliable carry distances.", "practice");
        if (penalties >= 1.5) addInsight(insights, "penalties", "Keep the ball in play", "Penalty strokes cost you " + round(penalties) + " shots per round on average.", "practice");
        if (results.size() >= 6) {
            int split = results.size() / 2;
            double early = results.subList(0, split).stream().mapToInt(r -> r.score - r.par).average().orElse(0);
            double recent = results.subList(results.size() - split, results.size()).stream().mapToInt(r -> r.score - r.par).average().orElse(0);
            double change = early - recent;
            if (Math.abs(change) >= 1.5) addInsight(insights, "trend", change > 0 ? "Your scoring is improving" : "Recent form needs attention", "Your recent rounds are " + round(Math.abs(change)) + " strokes " + (change > 0 ? "better" : "higher") + " relative to par than your earlier rounds.", change > 0 ? "positive" : "attention");
        }
        return insights;
    }

    private ArrayNode holeStatistics(List<RoundResult> results) {
        Map<Integer, int[]> totals = new HashMap<>();
        results.forEach(r -> r.holeScores.forEach((hole, value) -> {
            int[] target = totals.computeIfAbsent(hole, ignored -> new int[3]);
            for (int i = 0; i < 3; i++) target[i] += value[i];
        }));
        ArrayNode holes = mapper.createArrayNode();
        totals.entrySet().stream().sorted(Map.Entry.comparingByKey()).forEach(entry -> {
            int[] value = entry.getValue();
            holes.addObject().put("holeNumber", entry.getKey()).put("rounds", value[2])
                    .put("averageScore", round((double) value[0] / value[2]))
                    .put("averageToPar", round((double) (value[0] - value[1]) / value[2]));
        });
        return holes;
    }

    private void addInsight(ArrayNode array, String category, String title, String message, String tone) {
        array.addObject().put("category", category).put("title", title).put("message", message).put("tone", tone);
    }

    private void putNullable(ObjectNode node, String field, Number value) {
        if (value == null) node.putNull(field); else node.put(field, round(value.doubleValue()));
    }

    private double round(double value) { return Math.round(value * 10d) / 10d; }

    private static final class RoundResult {
        final JsonNode round;
        final String date;
        int score, par, holes, putts, penalties, bunkerShots, fairways, fairwaysHit, greens, greensHit;
        final Map<Integer, Integer> parStrokes = new HashMap<>();
        final Map<Integer, Integer> parHoles = new HashMap<>();
        final Map<Integer, int[]> holeScores = new HashMap<>();
        RoundResult(JsonNode round, JsonNode course) {
            this.round = round;
            this.date = round.path("date").asText(round.path("createdAt").asText());
        }
    }
}
