package com.example.demo.utils;

import com.example.demo.models.Company;

import java.util.ArrayList;
import java.util.List;

public class CompanyValidation {

    public static ValidationResult validate(Company company) {
        List<String> errors = new ArrayList<>();

        if (company.getName() == null || company.getName().isEmpty()) {
            errors.add("Company name is required");
        }
        if (company.getEmail() == null || !company.getEmail().contains("@")) {
            errors.add("Invalid company email");
        }
        if (company.getTin() == null || company.getTin().length() < 10) {
            errors.add("Invalid TIN");
        }
        if (company.getFoundedYear() != null && company.getFoundedYear() > java.time.Year.now().getValue()) {
            errors.add("Founded year is not valid");
        }
        if (company.getCompanyType() == null || company.getCompanyType().isEmpty()) {
            errors.add("Company type is required");
        }

        return new ValidationResult(errors.isEmpty(), errors);
    }

    public static class ValidationResult {
        private final boolean isValid;
        private final List<String> errors;

        public ValidationResult(boolean isValid, List<String> errors) {
            this.isValid = isValid;
            this.errors = errors;
        }

        public boolean isValid() {
            return isValid;
        }

        public List<String> getErrors() {
            return errors;
        }
    }
}
