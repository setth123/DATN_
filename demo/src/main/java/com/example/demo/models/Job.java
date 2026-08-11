package com.example.demo.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "jobs")
public class Job {

    @Id
    private String id;

    @DBRef
    private Company company;

    @TextIndexed
    private String title;

    @TextIndexed
    private String description;

    @TextIndexed
    private List<Skill> requiredSkills;

    private JobLevel level;

    private String salaryRange;

    private Date startDate;
    private Date endDate;

    @Builder.Default
    private int applicationsNum = 0;

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;

    public enum JobLevel {
        INTERN,
        FRESHER,
        JUNIOR,
        MID,
        SENIOR
    }
}
