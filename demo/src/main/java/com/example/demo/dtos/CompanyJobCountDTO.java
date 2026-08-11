package com.example.demo.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompanyJobCountDTO {
    private String _id;
    private String name;
    private String logoURL;
    private int jobCount;
}
