package com.example.demo.controllers;

import com.example.demo.services.RecommendedService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendedController {

    private final RecommendedService recommendedService;

    public RecommendedController(RecommendedService recommendedService) {
        this.recommendedService = recommendedService;
    }

    @GetMapping("/jobs")
    public ResponseEntity<List<RecommendedService.JobRecommendation>> recommendJobs(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(recommendedService.recommendJobs(userDetails.getUsername()));
    }

    @GetMapping("/candidates/job/{jobId}")
    public ResponseEntity<RecommendedService.CandidateRecommendationResult> recommendCandidateForJob(@AuthenticationPrincipal UserDetails userDetails, @PathVariable String jobId) {
        return ResponseEntity.ok(recommendedService.recommendCandidatesForJob(userDetails.getUsername(), jobId));
    }
}
