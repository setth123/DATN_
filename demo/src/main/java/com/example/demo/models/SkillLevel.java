package com.example.demo.models;

public enum SkillLevel {
    BASIC("Cơ bản"),
    INTERMEDIATE("Trung bình"),
    ADVANCED("Khá"),
    PROFICIENT("Thành thạo"),
    EXPERT("Chuyên gia");

    private final String value;

    SkillLevel(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
