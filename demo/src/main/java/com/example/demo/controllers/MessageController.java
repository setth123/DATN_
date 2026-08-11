package com.example.demo.controllers;

import com.example.demo.models.Message;
import com.example.demo.services.MessageService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping
    public ResponseEntity<List<Message>> getMessages(@AuthenticationPrincipal UserDetails userDetails,
                                                     @RequestParam String conversationId,
                                                     @RequestParam(defaultValue = "20") int limit,
                                                     @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Date before) {
        return ResponseEntity.ok(messageService.getMessages(conversationId, limit, before));
    }

    @PostMapping
    public ResponseEntity<Message> sendMessage(@AuthenticationPrincipal UserDetails userDetails,
                                               @RequestParam String conversationId,
                                               @RequestParam String text) {
        return ResponseEntity.ok(messageService.sendMessage(userDetails.getUsername(), conversationId, text));
    }
}
