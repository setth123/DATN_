package com.example.demo.controllers;

import com.example.demo.models.Application;
import com.example.demo.services.ApplicationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping
    public ResponseEntity<Application> applyJob(@AuthenticationPrincipal UserDetails userDetails,
                                                @RequestParam String jobId,
                                                @RequestParam String cvSnapshotUrl) {
        return ResponseEntity.status(HttpStatus.CREATED).body(applicationService.applyJob(userDetails.getUsername(), jobId, cvSnapshotUrl));
    }

    @DeleteMapping("/job/{jobId}")
    public ResponseEntity<Void> cancelApply(@AuthenticationPrincipal UserDetails userDetails, @PathVariable String jobId) {
        applicationService.cancelApply(userDetails.getUsername(), jobId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/my-applications")
    public ResponseEntity<Map<String, Object>> getMyApplications(@AuthenticationPrincipal UserDetails userDetails,
                                                                 @RequestParam(defaultValue = "1") int page,
                                                                 @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(applicationService.getMyApplications(userDetails.getUsername(), page, limit));
    }
}
