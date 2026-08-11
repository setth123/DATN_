package com.example.demo.controllers;

import com.example.demo.models.Job;
import com.example.demo.services.JobService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    @PostMapping
    public ResponseEntity<Job> createOrUpdateJob(@AuthenticationPrincipal UserDetails userDetails, @RequestBody Job job) {
        return ResponseEntity.status(HttpStatus.CREATED).body(jobService.createOrUpdateJob(userDetails.getUsername(), job));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJob(@AuthenticationPrincipal UserDetails userDetails, @PathVariable String id) {
        jobService.deleteJob(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Job> getJobById(@PathVariable String id) {
        Job job = jobService.getJobById(id);
        if (job == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(job);
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<Job>> getJobsByCompany(@PathVariable String companyId) {
        return ResponseEntity.ok(jobService.getJobsByCompany(companyId));
    }

    @GetMapping
    public ResponseEntity<String> getJobs(@RequestParam(required = false) String keyword,
                                          @RequestParam(required = false) String skillName,
                                          @RequestParam(required = false) String skillLevel,
                                          @RequestParam(required = false) String locations,
                                          @RequestParam(defaultValue = "1") int page,
                                          @RequestParam(defaultValue = "12") int limit,
                                          @RequestParam(defaultValue = "newest") String sort) {
        // Implementation for getJobs will be added later
        return ResponseEntity.ok("Get jobs API is not yet implemented fully.");
    }
}
