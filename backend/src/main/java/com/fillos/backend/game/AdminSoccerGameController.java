package com.fillos.backend.game;

import com.fillos.backend.game.GameDtos.SoccerAnalyticsResponse;
import com.fillos.backend.game.GameDtos.SoccerSettingsPatchRequest;
import com.fillos.backend.game.GameDtos.SoccerSettingsResponse;
import jakarta.validation.Valid;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/admin/games/soccer")
public class AdminSoccerGameController {
    private final GameRepository gameRepository;

    public AdminSoccerGameController(GameRepository gameRepository) {
        this.gameRepository = gameRepository;
    }

    @GetMapping("/settings")
    public SoccerSettingsResponse getSettings() {
        return gameRepository.getSoccerSettings();
    }

    @PatchMapping("/settings")
    public SoccerSettingsResponse patchSettings(@Valid @RequestBody SoccerSettingsPatchRequest body) {
        try {
            return gameRepository.patchSoccerSettings(body);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @GetMapping("/analytics")
    @ResponseStatus(HttpStatus.OK)
    public SoccerAnalyticsResponse analytics() {
        return gameRepository.getSoccerAnalytics(Instant.now());
    }
}
