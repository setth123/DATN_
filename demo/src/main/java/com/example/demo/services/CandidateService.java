package com.example.demo.services;

import com.example.demo.models.Candidate;
import com.example.demo.models.User;
import com.example.demo.repositories.CandidateRepository;
import com.example.demo.repositories.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class CandidateService {

    private final CandidateRepository candidateRepository;
    private final UserRepository userRepository;

    public CandidateService(CandidateRepository candidateRepository, UserRepository userRepository) {
        this.candidateRepository = candidateRepository;
        this.userRepository = userRepository;
    }

    public Candidate getMyCandidateProfile(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow(() -> new RuntimeException("User not found"));
        return candidateRepository.findByUser(user).orElse(null);
    }

    public Candidate getCandidateById(String candidateId) {
        return candidateRepository.findById(candidateId).orElse(null);
    }

    public Candidate createOrUpdateCandidateProfile(String userEmail, Candidate candidateData) {
        User user = userRepository.findByEmail(userEmail).orElseThrow(() -> new RuntimeException("User not found"));
        Candidate existingCandidate = candidateRepository.findByUser(user).orElse(null);

        if (existingCandidate != null) {
            candidateData.setId(existingCandidate.getId());
            candidateData.setUser(user);
            candidateData.setCreatedAt(existingCandidate.getCreatedAt());
            return candidateRepository.save(candidateData);
        } else {
            candidateData.setUser(user);
            return candidateRepository.save(candidateData);
        }
    }
}
