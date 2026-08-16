package com.golfscorekeeper.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.golfscorekeeper.service.GolfDatabase;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ApiController {
    private final GolfDatabase db;

    public ApiController(GolfDatabase db) { this.db = db; }

    @GetMapping("/status") public ObjectNode status() throws IOException { return db.status(); }
    @GetMapping("/courses") public JsonNode courses() { return db.all("courses"); }
    @PostMapping("/courses") @ResponseStatus(HttpStatus.CREATED)
    public ObjectNode createCourse(@RequestBody ObjectNode body) throws IOException { return db.createCourse(body); }
    @PutMapping("/courses/{id}") public ObjectNode updateCourse(@PathVariable String id, @RequestBody ObjectNode body) throws IOException { return found(db.update("courses", id, body), "Course"); }
    @DeleteMapping("/courses/{id}") public ObjectNode deleteCourse(@PathVariable String id) throws IOException { return deleted("courses", id, "Course"); }

    @GetMapping("/players") public JsonNode players() { return db.all("players"); }
    @PostMapping("/players") @ResponseStatus(HttpStatus.CREATED)
    public ObjectNode createPlayer(@RequestBody ObjectNode body) throws IOException { return db.createPlayer(body); }
    @PutMapping("/players/{id}") public ObjectNode updatePlayer(@PathVariable String id, @RequestBody ObjectNode body) throws IOException { return found(db.update("players", id, body), "Player"); }
    @DeleteMapping("/players/{id}") public ObjectNode deletePlayer(@PathVariable String id) throws IOException { return deleted("players", id, "Player"); }

    @GetMapping("/rounds")
    public List<JsonNode> rounds(@RequestParam(required = false) String status,
                                 @RequestParam(required = false) String playerId,
                                 @RequestParam(required = false) String courseId) { return db.rounds(status, playerId, courseId); }
    @GetMapping("/rounds/{id}") public JsonNode round(@PathVariable String id) { return found(db.find("rounds", id), "Round"); }
    @PostMapping("/rounds") @ResponseStatus(HttpStatus.CREATED)
    public ObjectNode createRound(@RequestBody ObjectNode body) throws IOException { return db.createRound(body); }
    @PutMapping("/rounds/{id}") public ObjectNode updateRound(@PathVariable String id, @RequestBody ObjectNode body) throws IOException { return found(db.update("rounds", id, body), "Round"); }
    @DeleteMapping("/rounds/{id}") public ObjectNode deleteRound(@PathVariable String id) throws IOException { return deleted("rounds", id, "Round"); }

    @GetMapping("/database/export")
    public ResponseEntity<ObjectNode> exportDatabase() {
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=golf-database-backup-" + LocalDate.now() + ".json").body(db.export());
    }
    @PostMapping("/database/restore") public ObjectNode restore(@RequestBody JsonNode backup) throws IOException { return db.restore(backup); }
    @PostMapping("/database/reset") public ObjectNode reset() throws IOException { return db.reset(); }

    private <T extends JsonNode> T found(T value, String type) {
        if (value == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, type + " not found");
        return value;
    }
    private ObjectNode deleted(String collection, String id, String type) throws IOException {
        JsonNode value = found(db.delete(collection, id), type);
        ObjectNode response = db.export().objectNode().put("message", type + " deleted");
        response.set(type.toLowerCase(), value);
        return response;
    }
}
