package com.example.demo.dtos;

import com.example.demo.models.Application;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobApplicationsDTO {
    private JobInfo job;
    private List<Application> applications;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobInfo {
        private String id;
        private String title;
    }
}
