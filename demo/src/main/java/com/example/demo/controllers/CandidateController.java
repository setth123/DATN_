package com.example.demo.controllers;

import com.example.demo.models.Candidate;
import com.example.demo.services.CandidateService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/candidates")
public class CandidateController {

    private final CandidateService candidateService;

    public CandidateController(CandidateService candidateService) {
        this.candidateService = candidateService;
    }

    @GetMapping("/my-profile")
    public ResponseEntity<Candidate> getMyProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(candidateService.getMyCandidateProfile(userDetails.getUsername()));
    }

    @PostMapping
    public ResponseEntity<Candidate> createOrUpdateProfile(@AuthenticationPrincipal UserDetails userDetails, @RequestBody Candidate candidate) {
        return ResponseEntity.ok(candidateService.createOrUpdateCandidateProfile(userDetails.getUsername(), candidate));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Candidate> getCandidateById(@PathVariable String id) {
        Candidate candidate = candidateService.getCandidateById(id);
        if (candidate == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(candidate);
    }
}
