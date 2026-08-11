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
@Document(collection = "candidates")
public class Candidate {

    @Id
    private String id;

    @DBRef
    private User user;

    private String fullName;
    private String phone;
    private String title;
    private String bio;

    private List<Skill> skills;
    private List<Experience> experiences;
    private List<Education> education;
    private List<Resume> resumes;

    @Builder.Default
    private boolean isOpenToWork = true;

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Experience {
        private String company;
        private String position;
        private Date startDate;
        private Date endDate;
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Education {
        private String school;
        private String degree;
        private Integer startYear;
        private Integer endYear;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Resume {
        private String fileUrl;
        private String fileName;
        private String extractedText;
    }
}
