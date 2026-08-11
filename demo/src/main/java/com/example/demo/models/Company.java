package com.example.demo.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "companies")
public class Company {

    @Id
    private String id;

    @DBRef
    private User owner;

    private String name;

    private String website;

    private String email;

    private String description;

    @Builder.Default
    private CompanyStatus status = CompanyStatus.PENDING;

    private String tin; // Taxpayer Identification Number

    private String location;

    private String logoURL;

    private String companyType;

    private String mainOccupation;

    private Integer foundedYear;

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;

    public enum CompanyStatus {
        PENDING,
        APPROVED,
        REJECTED
    }
}
