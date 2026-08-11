package com.example.demo.services;

import com.example.demo.models.Application;
import com.example.demo.models.Candidate;
import com.example.demo.models.Job;
import com.example.demo.models.NotificationType;
import com.example.demo.repositories.ApplicationRepository;
import com.example.demo.repositories.CandidateRepository;
import com.example.demo.repositories.JobRepository;
import com.example.demo.repositories.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final CandidateRepository candidateRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SocketService socketService;

    public ApplicationService(ApplicationRepository applicationRepository, CandidateRepository candidateRepository, JobRepository jobRepository, UserRepository userRepository, NotificationService notificationService, SocketService socketService) {
        this.applicationRepository = applicationRepository;
        this.candidateRepository = candidateRepository;
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.socketService = socketService;
    }

    public Application applyJob(String userEmail, String jobId, String cvSnapshotUrl) {
        Candidate candidate = candidateRepository.findByUser(userRepository.findByEmail(userEmail).orElseThrow()).orElseThrow(() -> new RuntimeException("Candidate profile not found"));
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new RuntimeException("Job not found"));

        if (applicationRepository.findByJobAndCandidate(job, candidate).isPresent()) {
            throw new RuntimeException("Already applied to this job");
        }

        if (job.getCompany().getOwner().getEmail().equals(userEmail)) {
            throw new RuntimeException("Cannot apply to your own job");
        }

        Application application = Application.builder()
                .job(job)
                .candidate(candidate)
                .cvSnapshotUrl(cvSnapshotUrl)
                .build();
        applicationRepository.save(application);

        job.setApplicationsNum(job.getApplicationsNum() + 1);
        jobRepository.save(job);

        // Create notification for the company
        Map<String, Object> notificationData = new HashMap<>();
        notificationData.put("to", job.getCompany().getOwner().getId());
        notificationData.put("from", candidate.getId());
        notificationData.put("fromModel", "Candidate");
        notificationData.put("type", NotificationType.NEW_APPLICATION);
        notificationData.put("displayName", candidate.getFullName());
        notificationData.put("jobTitle", job.getTitle());

        notificationService.createNotification(
            job.getCompany().getOwner(),
            candidate.getId(),
            "Candidate",
            NotificationType.NEW_APPLICATION,
            candidate.getFullName(),
            job.getTitle(),
            null
        );
        socketService.emitNotification(job.getCompany().getOwner().getId(), notificationData);

        return application;
    }

    public boolean cancelApply(String userEmail, String jobId) {
        Candidate candidate = candidateRepository.findByUser(userRepository.findByEmail(userEmail).orElseThrow()).orElseThrow(() -> new RuntimeException("Candidate profile not found"));
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new RuntimeException("Job not found"));

        Application application = applicationRepository.findByJobAndCandidate(job, candidate).orElseThrow(() -> new RuntimeException("Application not found"));
        applicationRepository.delete(application);

        job.setApplicationsNum(job.getApplicationsNum() - 1);
        jobRepository.save(job);
        return true;
    }

    public Map<String, Object> getMyApplications(String userEmail, int page, int limit) {
        Candidate candidate = candidateRepository.findByUser(userRepository.findByEmail(userEmail).orElseThrow()).orElseThrow(() -> new RuntimeException("Candidate profile not found"));

        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Application> applicationsPage = applicationRepository.findByCandidate(candidate, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("data", applicationsPage.getContent());
        Map<String, Object> pagination = new HashMap<>();
        pagination.put("total", applicationsPage.getTotalElements());
        pagination.put("page", applicationsPage.getNumber() + 1);
        pagination.put("limit", applicationsPage.getSize());
        pagination.put("totalPages", applicationsPage.getTotalPages());
        response.put("pagination", pagination);
        return response;
    }
}
