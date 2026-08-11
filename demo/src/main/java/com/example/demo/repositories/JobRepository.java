package com.example.demo.repositories;

import com.example.demo.models.Company;
import com.example.demo.models.Job;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface JobRepository extends MongoRepository<Job, String> {
    List<Job> findByCompany(Company company);
}
