package com.example.demo.services;

import com.example.demo.dtos.CompanyJobCountDTO;
import com.example.demo.dtos.JobApplicationsDTO;
import com.example.demo.models.Application;
import com.example.demo.models.Company;
import com.example.demo.models.Job;
import com.example.demo.models.User;
import com.example.demo.repositories.ApplicationRepository;
import com.example.demo.repositories.CompanyRepository;
import com.example.demo.repositories.JobRepository;
import com.example.demo.repositories.UserRepository;
import com.example.demo.utils.CompanyValidation;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final MailService mailService;
    private final MongoTemplate mongoTemplate;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;

    public CompanyService(CompanyRepository companyRepository, UserRepository userRepository, MailService mailService, MongoTemplate mongoTemplate, JobRepository jobRepository, ApplicationRepository applicationRepository) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.mailService = mailService;
        this.mongoTemplate = mongoTemplate;
        this.jobRepository = jobRepository;
        this.applicationRepository = applicationRepository;
    }

    public Company getMyCompany(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        return companyRepository.findByOwner(user);
    }

    public Company getCompanyById(String companyId) {
        return companyRepository.findById(companyId).orElse(null);
    }

    public Company createOrUpdateCompany(String userId, Company companyData) {
        User user = userRepository.findById(userId).orElseThrow();
        Company existingCompany = companyRepository.findByOwner(user);

        if (existingCompany != null) {
            // Update existing company
            return updateCompany(userId, companyData);
        }

        CompanyValidation.ValidationResult validation = CompanyValidation.validate(companyData);
        Company.CompanyStatus status;

        if (validation.isValid()) {
            status = Company.CompanyStatus.APPROVED;
        } else {
            status = Company.CompanyStatus.REJECTED;
        }

        companyData.setOwner(user);
        companyData.setStatus(status);

        Company company = companyRepository.save(companyData);

        if (status == Company.CompanyStatus.APPROVED) {
            user.getRoles().setRecruiter(true);
            userRepository.save(user);
            mailService.sendCompanyApprovalMail(user.getEmail(), company.getName());
        } else {
            mailService.sendCompanyRejectedMail(user.getEmail(), validation.getErrors());
        }

        return company;
    }

    public List<CompanyJobCountDTO> getMostJobCompany() {
        Date thirtyDaysAgo = new Date(System.currentTimeMillis() - 30L * 24 * 60 * 60 * 1000);

        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("status").is(Company.CompanyStatus.APPROVED)),
                Aggregation.lookup("jobs", "_id", "company.$id", "jobs"),
                Aggregation.unwind("jobs"),
                Aggregation.match(Criteria.where("jobs.createdAt").gte(thirtyDaysAgo)),
                Aggregation.group("_id")
                        .first("name").as("name")
                        .first("logoURL").as("logoURL")
                        .count().as("jobCount"),
                Aggregation.sort(Sort.Direction.DESC, "jobCount"),
                Aggregation.limit(6)
        );

        return mongoTemplate.aggregate(aggregation, Company.class, CompanyJobCountDTO.class).getMappedResults();
    }

    public Company updateCompany(String userId, Company companyData) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Company company = companyRepository.findByOwner(user);

        if (company == null) {
            throw new RuntimeException("Company not found");
        }

        Company oldCompany = companyRepository.findByOwner(user);

        companyData.setId(oldCompany.getId());
        companyData.setOwner(user);
        companyData.setCreatedAt(oldCompany.getCreatedAt());

        CompanyValidation.ValidationResult validation = CompanyValidation.validate(companyData);

        if (!validation.isValid()) {
            mailService.sendCompanyRejectedMail(user.getEmail(), validation.getErrors());
            return oldCompany; // Return old data if validation fails
        }

        companyData.setStatus(Company.CompanyStatus.APPROVED);
        Company updatedCompany = companyRepository.save(companyData);

        user.getRoles().setRecruiter(true);
        userRepository.save(user);

        mailService.sendCompanyApprovalMail(user.getEmail(), updatedCompany.getName());

        return updatedCompany;
    }

    public JobApplicationsDTO getApplicationsByJob(String userId, String jobId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Company company = companyRepository.findByOwner(user);

        if (company == null || company.getStatus() != Company.CompanyStatus.APPROVED) {
            throw new RuntimeException("Company not found or not approved");
        }

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        if (!job.getCompany().getId().equals(company.getId())) {
            throw new RuntimeException("Job does not belong to this company or access denied");
        }

        List<Application> applications = applicationRepository.findByJobOrderByCreatedAtDesc(job);

        return new JobApplicationsDTO(
                new JobApplicationsDTO.JobInfo(job.getId(), job.getTitle()),
                applications
        );
    }

}
