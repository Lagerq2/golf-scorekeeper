package com.golfscorekeeper.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.StreamSupport;

@Service
public class GolfDatabase {
    private final ObjectMapper mapper;
    private final Path databaseFile;
    private ObjectNode database;

    public GolfDatabase(ObjectMapper mapper,
                        @Value("${golf.database.path:data/database.json}") String databasePath) {
        this.mapper = mapper;
        this.databaseFile = Path.of(databasePath).toAbsolutePath().normalize();
    }

    @PostConstruct
    synchronized void load() throws IOException {
        if (Files.exists(databaseFile)) {
            JsonNode loaded = mapper.readTree(databaseFile.toFile());
            if (isValidBackup(loaded)) {
                database = (ObjectNode) loaded;
                if (normalizeCourses()) save();
                return;
            }
        }
        reset();
    }

    public synchronized ObjectNode status() throws IOException {
        ObjectNode result = mapper.createObjectNode();
        ArrayNode rounds = array("rounds");
        result.put("status", "online");
        result.put("database", "Spring Boot JSON Database");
        result.put("totalCourses", array("courses").size());
        result.put("totalPlayers", array("players").size());
        result.put("totalRounds", rounds.size());
        result.put("completedRounds", countByStatus(rounds, "completed"));
        result.put("inProgressRounds", countByStatus(rounds, "in_progress"));
        result.put("lastUpdated", database.path("lastUpdated").asText(Instant.now().toString()));
        result.put("fileStorageBytes", Files.exists(databaseFile) ? Files.size(databaseFile) : 0);
        return result;
    }

    public synchronized ArrayNode all(String collection) {
        return array(collection).deepCopy();
    }

    public synchronized List<JsonNode> rounds(String status, String playerId, String courseId) {
        return StreamSupport.stream(array("rounds").spliterator(), false)
                .filter(round -> status == null || status.equals(round.path("status").asText()))
                .filter(round -> courseId == null || courseId.equals(round.path("courseId").asText()))
                .filter(round -> playerId == null || StreamSupport.stream(round.path("players").spliterator(), false)
                        .anyMatch(player -> playerId.equals(player.path("playerId").asText())))
                .sorted(Comparator.comparing((JsonNode round) -> round.path("date").asText(
                        round.path("createdAt").asText())).reversed())
                .map(round -> (JsonNode) round.deepCopy())
                .toList();
    }

    public synchronized JsonNode find(String collection, String id) {
        return StreamSupport.stream(array(collection).spliterator(), false)
                .filter(item -> id.equals(item.path("id").asText()))
                .findFirst().map(item -> (JsonNode) item.deepCopy()).orElse(null);
    }

    public synchronized ObjectNode createCourse(ObjectNode input) throws IOException {
        requireText(input, "name", "Course name is required");
        if (!input.path("holes").isArray()) throw new IllegalArgumentException("A valid holes array is required");
        ObjectNode course = input.deepCopy();
        course.put("id", id("course"));
        course.put("name", course.path("name").asText().trim());
        course.put("location", course.path("location").asText(""));
        course.put("city", course.path("city").asText(""));
        course.put("country", course.path("country").asText(""));
        course.put("holesCount", course.path("holesCount").asInt() == 9 ? 9 : 18);
        course.put("parTotal", StreamSupport.stream(course.path("holes").spliterator(), false)
                .mapToInt(hole -> hole.path("par").asInt(4)).sum());
        course.put("createdAt", Instant.now().toString());
        course.put("isCustom", true);
        normalizeCourse(course);
        array("courses").insert(0, course);
        save();
        return course.deepCopy();
    }

    public synchronized ObjectNode createPlayer(ObjectNode input) throws IOException {
        requireText(input, "name", "Player name is required");
        ObjectNode player = input.deepCopy();
        player.put("id", id("player"));
        player.put("name", player.path("name").asText().trim());
        if (!player.has("handicapIndex")) player.put("handicapIndex", 18.0);
        if (!player.hasNonNull("defaultTee")) player.put("defaultTee", "white");
        if (!player.hasNonNull("avatarBg")) player.put("avatarBg", "#059669");
        player.put("createdAt", Instant.now().toString());
        array("players").add(player);
        save();
        return player.deepCopy();
    }

    public synchronized ObjectNode createRound(ObjectNode input) throws IOException {
        requireText(input, "courseId", "Course is required");
        if (!input.path("players").isArray() || input.path("players").isEmpty())
            throw new IllegalArgumentException("At least one player is required");
        String now = Instant.now().toString();
        ObjectNode round = input.deepCopy();
        round.put("id", id("round"));
        if (!round.hasNonNull("date")) round.put("date", now);
        if (!round.hasNonNull("courseName")) round.put("courseName", "Golf Course");
        if (!round.hasNonNull("courseLocation")) round.put("courseLocation", "");
        round.put("holesPlayed", round.path("holesPlayed").asInt() == 9 ? 9 : 18);
        round.put("startingHole", round.path("startingHole").asInt(1));
        if (!round.hasNonNull("format")) round.put("format", "stroke");
        round.put("status", "in_progress");
        if (!round.hasNonNull("weather")) round.put("weather", "");
        if (!round.hasNonNull("notes")) round.put("notes", "");
        round.put("createdAt", now);
        round.put("updatedAt", now);
        array("rounds").insert(0, round);
        save();
        return round.deepCopy();
    }

    public synchronized ObjectNode update(String collection, String id, ObjectNode updates) throws IOException {
        ArrayNode items = array(collection);
        for (int i = 0; i < items.size(); i++) {
            if (id.equals(items.get(i).path("id").asText())) {
                ObjectNode current = (ObjectNode) items.get(i);
                updates.fields().forEachRemaining(entry -> {
                    if (!"id".equals(entry.getKey())) current.set(entry.getKey(), entry.getValue());
                });
                current.put("id", id);
                if ("courses".equals(collection) && current.path("holes").isArray()) {
                    normalizeCourse(current);
                    current.put("parTotal", StreamSupport.stream(current.path("holes").spliterator(), false)
                            .mapToInt(hole -> hole.path("par").asInt(4)).sum());
                }
                if ("rounds".equals(collection)) current.put("updatedAt", Instant.now().toString());
                save();
                return current.deepCopy();
            }
        }
        return null;
    }

    public synchronized JsonNode delete(String collection, String id) throws IOException {
        ArrayNode items = array(collection);
        for (int i = 0; i < items.size(); i++) {
            if (id.equals(items.get(i).path("id").asText())) {
                JsonNode removed = items.remove(i);
                save();
                return removed;
            }
        }
        return null;
    }

    public synchronized ObjectNode export() { return database.deepCopy(); }

    public synchronized ObjectNode restore(JsonNode backup) throws IOException {
        if (!isValidBackup(backup)) throw new IllegalArgumentException("Invalid database backup structure");
        database = ((ObjectNode) backup).deepCopy();
        database.put("version", database.path("version").asText("1.0.0"));
        normalizeCourses();
        save();
        return counts("Database restored successfully");
    }

    public synchronized ObjectNode reset() throws IOException {
        try (var stream = new ClassPathResource("seed/database.json").getInputStream()) {
            database = (ObjectNode) mapper.readTree(stream);
        }
        normalizeCourses();
        save();
        return counts("Database reset to initial sample records");
    }

    private ObjectNode counts(String message) {
        ObjectNode response = mapper.createObjectNode().put("message", message);
        ObjectNode counts = response.putObject("counts");
        counts.put("courses", array("courses").size()).put("players", array("players").size()).put("rounds", array("rounds").size());
        return response;
    }

    private void save() throws IOException {
        database.put("lastUpdated", Instant.now().toString());
        Files.createDirectories(databaseFile.getParent());
        Path temp = Files.createTempFile(databaseFile.getParent(), "golf-db-", ".tmp");
        mapper.writerWithDefaultPrettyPrinter().writeValue(temp.toFile(), database);
        Files.move(temp, databaseFile, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
    }

    private ArrayNode array(String name) { return (ArrayNode) database.withArray(name); }

    /** Normalizes metric tee distances and migrates legacy yard values using 1 yd = 0.9144 m. */
    private boolean normalizeCourses() {
        boolean changed = false;
        for (JsonNode node : array("courses")) {
            if (node.isObject()) changed |= normalizeCourse((ObjectNode) node);
        }
        return changed;
    }

    private boolean normalizeCourse(ObjectNode course) {
        if (!course.path("holes").isArray()) return false;
        boolean changed = false;
        Map<String, Boolean> courseTees = new LinkedHashMap<>();

        for (JsonNode node : course.withArray("holes")) {
            if (!node.isObject()) continue;
            ObjectNode hole = (ObjectNode) node;
            Map<String, Integer> distancesMeters = new LinkedHashMap<>();

            if (hole.path("tees").isArray()) {
                for (JsonNode teeNode : hole.path("tees")) {
                    String tee = teeNode.path("tee").asText("").trim().toUpperCase(Locale.ROOT);
                    int meters = teeNode.path("meters").asInt(0);
                    if (meters <= 0 && teeNode.path("yards").asInt(0) > 0) {
                        meters = yardsToMeters(teeNode.path("yards").asInt());
                    }
                    if (!tee.isBlank() && meters > 0) distancesMeters.put(tee, meters);
                }
            }

            if (hole.path("meters").isObject()) {
                hole.path("meters").fields().forEachRemaining(entry -> {
                    String tee = entry.getKey().trim().toUpperCase(Locale.ROOT);
                    int meters = entry.getValue().asInt(0);
                    if (!tee.isBlank() && meters > 0) distancesMeters.putIfAbsent(tee, meters);
                });
            }

            // Compatibility for database files and API payloads saved before metric conversion.
            if (hole.path("yards").isObject()) {
                hole.path("yards").fields().forEachRemaining(entry -> {
                    String tee = entry.getKey().trim().toUpperCase(Locale.ROOT);
                    int yards = entry.getValue().asInt(0);
                    if (!tee.isBlank() && yards > 0) distancesMeters.putIfAbsent(tee, yardsToMeters(yards));
                });
            }

            ArrayNode tees = mapper.createArrayNode();
            ObjectNode metersByTee = mapper.createObjectNode();
            distancesMeters.forEach((tee, meters) -> {
                tees.addObject().put("tee", tee).put("meters", meters);
                metersByTee.put(tee.toLowerCase(Locale.ROOT), meters);
                courseTees.put(tee, true);
            });

            if (!tees.equals(hole.path("tees")) || !metersByTee.equals(hole.path("meters")) || hole.has("yards")) changed = true;
            hole.set("tees", tees);
            hole.set("meters", metersByTee);
            hole.remove("yards");
        }

        ArrayNode availableTees = mapper.createArrayNode();
        courseTees.keySet().forEach(availableTees::add);
        if (!availableTees.equals(course.path("availableTees"))) changed = true;
        course.set("availableTees", availableTees);
        return changed;
    }

    private int yardsToMeters(int yards) {
        return (int) Math.round(yards * 0.9144d);
    }
    private boolean isValidBackup(JsonNode node) {
        return node != null && node.isObject() && node.path("courses").isArray()
                && node.path("players").isArray() && node.path("rounds").isArray();
    }
    private long countByStatus(ArrayNode rounds, String status) {
        return StreamSupport.stream(rounds.spliterator(), false).filter(r -> status.equals(r.path("status").asText())).count();
    }
    private void requireText(ObjectNode input, String field, String message) {
        if (!input.hasNonNull(field) || input.path(field).asText().isBlank()) throw new IllegalArgumentException(message);
    }
    private String id(String prefix) { return prefix + "-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 5); }
}
