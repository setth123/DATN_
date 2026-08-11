package com.example.demo.controllers;

import com.example.demo.dtos.CompanyJobCountDTO;
import com.example.demo.dtos.JobApplicationsDTO;
import com.example.demo.models.Company;
import com.example.demo.services.CompanyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @GetMapping("/my-company")
    public ResponseEntity<Company> getMyCompany(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(companyService.getMyCompany(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Company> getCompanyById(@PathVariable String id) {
        Company company = companyService.getCompanyById(id);
        if (company == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(company);
    }

    @PostMapping
    public ResponseEntity<Company> createOrUpdateCompany(@AuthenticationPrincipal UserDetails userDetails, @RequestBody Company company) {
        return ResponseEntity.ok(companyService.createOrUpdateCompany(userDetails.getUsername(), company));
    }

    @GetMapping("/jobs/{jobId}/applications")
    public ResponseEntity<JobApplicationsDTO> getJobApplications(@AuthenticationPrincipal UserDetails userDetails, @PathVariable String jobId) {
        return ResponseEntity.ok(companyService.getApplicationsByJob(userDetails.getUsername(), jobId));
    }

    @GetMapping("/most-jobs")
    public ResponseEntity<List<CompanyJobCountDTO>> getMostJobCompany() {
        return ResponseEntity.ok(companyService.getMostJobCompany());
    }
}
