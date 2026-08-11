package com.example.demo.services;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class JobQueryService {

    public List<Criteria> buildJobKeywordConditions(String keyword) {
        if (keyword == null || keyword.isEmpty()) {
            return new ArrayList<>();
        }
        Pattern searchRegex = Pattern.compile(keyword, Pattern.CASE_INSENSITIVE);
        return List.of(
                Criteria.where("title").regex(searchRegex),
                Criteria.where("description").regex(searchRegex),
                Criteria.where("level").regex(searchRegex),
                Criteria.where("requiredSkills.name").regex(searchRegex)
        );
    }

    public Sort buildSortQuery(String sort) {
        if (sort == null) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        switch (sort) {
            case "oldest":
                return Sort.by(Sort.Direction.ASC, "createdAt");
            case "newest":
            default:
                return Sort.by(Sort.Direction.DESC, "createdAt");
        }
    }
}
