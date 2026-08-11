package com.example.demo.controllers;

import com.example.demo.models.Conversation;
import com.example.demo.services.ConversationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @PostMapping("/private")
    public ResponseEntity<Conversation> getOrCreateConversation(@AuthenticationPrincipal UserDetails userDetails, @RequestBody String targetUserId) {
        return ResponseEntity.ok(conversationService.getOrCreateConversation(userDetails.getUsername(), targetUserId));
    }

    @PostMapping("/ai")
    public ResponseEntity<String> createOrGetAIConversation(@AuthenticationPrincipal UserDetails userDetails, @RequestBody(required = false) String systemInstruction) {
        return ResponseEntity.ok(conversationService.getOrCreateAIConversation(userDetails.getUsername(), systemInstruction));
    }
}
