package com.golfscorekeeper.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StatisticsServiceTest {
    private final ObjectMapper mapper = new ObjectMapper();
    private GolfDatabase database;
    private StatisticsService service;
    private ArrayNode courses;
    private List<JsonNode> rounds;

    @BeforeEach
    void setUp() {
        database = mock(GolfDatabase.class);
        service = new StatisticsService(database, mapper);
        courses = mapper.createArrayNode().add(course());
        rounds = List.of(round("r1", "2026-01-01", 5, 3, "left", false, 2),
                round("r2", "2026-02-01", 4, 2, "hit", true, 1),
                round("r3", "2026-03-01", 6, 3, "right", false, 2));
        when(database.all("courses")).thenReturn(courses);
        when(database.rounds(eq("completed"), eq("player-1"), any())).thenReturn(rounds);
    }

    @Test
    void aggregatesPersonalPerformanceFromCompletedHoleScores() {
        ObjectNode stats = service.playerStatistics("player-1");

        assertThat(stats.path("roundsPlayed").asInt()).isEqualTo(3);
        assertThat(stats.path("averageScore").asDouble()).isEqualTo(5.0);
        assertThat(stats.path("averageToPar").asDouble()).isEqualTo(1.0);
        assertThat(stats.path("puttsPerHole").asDouble()).isEqualTo(2.7);
        assertThat(stats.path("fairwayPct").asDouble()).isEqualTo(33.3);
        assertThat(stats.path("girPct").asDouble()).isEqualTo(33.3);
        assertThat(stats.path("averagePenalties").asDouble()).isEqualTo(1.7);
        assertThat(stats.path("trend")).hasSize(3);
    }

    @Test
    void emitsPracticeInsightsOnlyAfterEnoughRounds() {
        JsonNode insights = service.playerStatistics("player-1").path("insights");

        assertThat(insights).hasSizeGreaterThanOrEqualTo(3);
        assertThat(insights.toString()).contains("putting", "approach", "penalties");
    }

    @Test
    void calculatesPerCourseHoleAverages() {
        JsonNode courseStats = service.courseStatistics("player-1").get(0);

        assertThat(courseStats.path("courseName").asText()).isEqualTo("Test Course");
        assertThat(courseStats.path("holes").get(0).path("averageScore").asDouble()).isEqualTo(5.0);
        assertThat(courseStats.path("holes").get(0).path("averageToPar").asDouble()).isEqualTo(1.0);
    }

    private ObjectNode course() {
        ObjectNode course = mapper.createObjectNode().put("id", "course-1").put("name", "Test Course");
        course.putArray("holes").addObject().put("holeNumber", 1).put("par", 4);
        return course;
    }

    private ObjectNode round(String id, String date, int strokes, int putts, String fairway, boolean gir, int penalties) {
        ObjectNode round = mapper.createObjectNode().put("id", id).put("date", date)
                .put("courseId", "course-1").put("courseName", "Test Course")
                .put("holesPlayed", 1).put("status", "completed");
        ObjectNode player = round.putArray("players").addObject().put("playerId", "player-1");
        player.putObject("holeScores").putObject("1").put("holeNumber", 1).put("strokes", strokes)
                .put("putts", putts).put("fairwayHit", fairway).put("greenInRegulation", gir)
                .put("penalties", penalties).put("bunkerShots", 1);
        return round;
    }
}
