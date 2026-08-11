package com.example.demo.repositories;

import com.example.demo.models.Candidate;
import com.example.demo.models.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface CandidateRepository extends MongoRepository<Candidate, String> {
    Optional<Candidate> findByUser(User user);
}
