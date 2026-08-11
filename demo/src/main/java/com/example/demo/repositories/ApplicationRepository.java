package com.example.demo.repositories;

import com.example.demo.models.Application;
import com.example.demo.models.Candidate;
import com.example.demo.models.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends MongoRepository<Application, String> {
    List<Application> findByJobOrderByCreatedAtDesc(Job job);
    Optional<Application> findByJobAndCandidate(Job job, Candidate candidate);
    Page<Application> findByCandidate(Candidate candidate, Pageable pageable);
}
