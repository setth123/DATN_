package com.example.demo.services;

import com.example.demo.models.Company;
import com.example.demo.models.Job;
import com.example.demo.models.User;
import com.example.demo.repositories.CompanyRepository;
import com.example.demo.repositories.JobRepository;
import com.example.demo.repositories.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    public JobService(JobRepository jobRepository, CompanyRepository companyRepository, UserRepository userRepository) {
        this.jobRepository = jobRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }

    public Job createOrUpdateJob(String userEmail, Job jobData) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        Company company = companyRepository.findByOwner(user);
        if (company == null || company.getStatus() != Company.CompanyStatus.APPROVED) {
            throw new RuntimeException("Approved company not found");
        }
        jobData.setCompany(company);
        return jobRepository.save(jobData);
    }

    public void deleteJob(String jobId, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow(() -> new RuntimeException("User not found"));
        Company company = companyRepository.findByOwner(user);
        if (company == null || company.getStatus() != Company.CompanyStatus.APPROVED) {
            throw new RuntimeException("Approved company not found for user");
        }

        Job job = jobRepository.findById(jobId).orElseThrow(() -> new RuntimeException("Job not found"));

        if (!job.getCompany().getId().equals(company.getId())) {
            throw new RuntimeException("Unauthorized to delete this job");
        }
        jobRepository.delete(job);
    }
    public Job getJobById(String jobId) {
        return jobRepository.findById(jobId).orElse(null);
    }

    public List<Job> getJobsByCompany(String companyId) {
        Company company = companyRepository.findById(companyId).orElseThrow();
        return jobRepository.findByCompany(company);
    }
}
