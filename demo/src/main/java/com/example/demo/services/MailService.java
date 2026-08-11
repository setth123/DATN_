package com.example.demo.services;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MailService {

    public void sendCompanyApprovalMail(String to, String companyName) {
        // Placeholder implementation
        System.out.println("Sending company approval mail to " + to + " for " + companyName);
    }

    public void sendCompanyRejectedMail(String to, List<String> errors) {
        // Placeholder implementation
        System.out.println("Sending company rejected mail to " + to + " with errors: " + errors);
    }
}
