package com.example.demo.repositories;

import com.example.demo.models.Company;
import com.example.demo.models.User;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CompanyRepository extends MongoRepository<Company, String> {
    Company findByOwner(User user);
}
