package com.example.demo.services;

import com.example.demo.models.*;
import com.example.demo.repositories.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class RecommendedService {

    private final CandidateRepository candidateRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final MatchingService matchingService;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;


    public RecommendedService(CandidateRepository candidateRepository, JobRepository jobRepository, ApplicationRepository applicationRepository, MatchingService matchingService, UserRepository userRepository, CompanyRepository companyRepository) {
        this.candidateRepository = candidateRepository;
        this.jobRepository = jobRepository;
        this.applicationRepository = applicationRepository;
        this.matchingService = matchingService;
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
    }

    public List<JobRecommendation> recommendJobs(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow(() -> new RuntimeException("User not found"));
        Candidate candidate = candidateRepository.findByUser(user).orElseThrow(() -> new RuntimeException("Candidate not found"));
        List<Job> jobs = jobRepository.findAll();

        List<Application> applications = applicationRepository.findByCandidate(candidate, null).getContent();
        List<String> appliedJobIds = applications.stream().map(app -> app.getJob().getId()).collect(Collectors.toList());

        List<Job> appliedJobs = jobRepository.findAllById(appliedJobIds);
        List<Skill> skillsFromAppliedJobs = appliedJobs.stream().flatMap(job -> job.getRequiredSkills().stream()).collect(Collectors.toList());

        List<Skill> combinedSkills = new ArrayList<>(candidate.getSkills());
        combinedSkills.addAll(skillsFromAppliedJobs);

        Map<String, Skill> uniqueSkillsMap = combinedSkills.stream()
                .filter(skill -> skill != null && skill.getName() != null)
                .collect(Collectors.toMap(
                        skill -> skill.getName().toLowerCase(),
                        Function.identity(),
                        (existing, replacement) -> existing
                ));
        List<Skill> augmentedCandidateSkills = new ArrayList<>(uniqueSkillsMap.values());

        List<String> previousTitles = appliedJobs.stream().map(Job::getTitle).collect(Collectors.toList());

        List<Job> filteredJobs = jobs.stream().filter(job -> !appliedJobIds.contains(job.getId())).collect(Collectors.toList());

        return filteredJobs.stream()
                .map(job -> {
                    MatchingService.MatchResult match = matchingService.matchCandidateToJob(job, candidate, augmentedCandidateSkills, previousTitles);
                    return new JobRecommendation(job, match.getPercentage(), match.getDetail());
                })
                .sorted((a, b) -> Long.compare(b.getMatchScore(), a.getMatchScore()))
                .limit(12)
                .collect(Collectors.toList());
    }

    public CandidateRecommendationResult recommendCandidatesForJob(String userEmail, String jobId) {
        User user = userRepository.findByEmail(userEmail).orElseThrow(() -> new RuntimeException("User not found"));
        Company company = companyRepository.findByOwner(user);
        if (company == null || company.getStatus() != Company.CompanyStatus.APPROVED) {
            throw new RuntimeException("Company not found or not approved");
        }

        Job job = jobRepository.findById(jobId).orElseThrow(() -> new RuntimeException("Job not found"));
        if (!job.getCompany().getId().equals(company.getId())) {
            throw new RuntimeException("Job not found or access denied");
        }

        List<Candidate> candidates = candidateRepository.findAll().stream().filter(Candidate::isOpenToWork).collect(Collectors.toList());

        List<CandidateRecommendation> results = candidates.stream()
                .map(candidate -> {
                    MatchingService.MatchResult match = matchingService.matchCandidateToJob(job, candidate, null, null);
                    return new CandidateRecommendation(candidate, match.getPercentage(), match.getDetail());
                })
                .filter(item -> item.getMatchScore() > 0)
                .sorted((a, b) -> Long.compare(b.getMatchScore(), a.getMatchScore()))
                .limit(10)
                .collect(Collectors.toList());

        return new CandidateRecommendationResult(job, results);
    }

    public static class JobRecommendation {
        private final Job job;
        private final long matchScore;
        private final MatchingService.MatchResult.MatchDetail matchDetail;

        public JobRecommendation(Job job, long matchScore, MatchingService.MatchResult.MatchDetail matchDetail) {
            this.job = job;
            this.matchScore = matchScore;
            this.matchDetail = matchDetail;
        }

        public Job getJob() {
            return job;
        }

        public long getMatchScore() {
            return matchScore;
        }

        public MatchingService.MatchResult.MatchDetail getMatchDetail() {
            return matchDetail;
        }
    }

    public static class CandidateRecommendation {
        private final Candidate candidate;
        private final long matchScore;
        private final MatchingService.MatchResult.MatchDetail matchDetail;

        public CandidateRecommendation(Candidate candidate, long matchScore, MatchingService.MatchResult.MatchDetail matchDetail) {
            this.candidate = candidate;
            this.matchScore = matchScore;
            this.matchDetail = matchDetail;
        }

        public Candidate getCandidate() {
            return candidate;
        }

        public long getMatchScore() {
            return matchScore;
        }

        public MatchingService.MatchResult.MatchDetail getMatchDetail() {
            return matchDetail;
        }
    }

    public static class CandidateRecommendationResult {
        private final Job job;
        private final List<CandidateRecommendation> candidates;

        public CandidateRecommendationResult(Job job, List<CandidateRecommendation> candidates) {
            this.job = job;
            this.candidates = candidates;
        }

        public Job getJob() {
            return job;
        }

        public List<CandidateRecommendation> getCandidates() {
            return candidates;
        }
    }
}
