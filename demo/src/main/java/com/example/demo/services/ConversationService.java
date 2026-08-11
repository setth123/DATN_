package com.example.demo.services;

import com.example.demo.models.Conversation;
import com.example.demo.models.User;
import com.example.demo.repositories.ConversationRepository;
import com.example.demo.repositories.UserRepository;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final CandidateService candidateService;

    public ConversationService(ConversationRepository conversationRepository, UserRepository userRepository, RedisTemplate<String, Object> redisTemplate, CandidateService candidateService) {
        this.conversationRepository = conversationRepository;
        this.userRepository = userRepository;
        this.redisTemplate = redisTemplate;
        this.candidateService = candidateService;
    }

    public Conversation getOrCreateConversation(String userEmail, String targetUserEmail) {
        if (targetUserEmail == null || targetUserEmail.isEmpty()) {
            throw new RuntimeException("Target user ID is required");
        }
        if (userEmail.equals(targetUserEmail)) {
            throw new RuntimeException("Cannot create conversation with oneself");
        }

        User user = userRepository.findByEmail(userEmail).orElseThrow(() -> new RuntimeException("User not found"));
        User targetUser = userRepository.findByEmail(targetUserEmail).orElseThrow(() -> new RuntimeException("Target user not found"));

        return conversationRepository.findByMembersIn(List.of(user, targetUser))
                .orElseGet(() -> {
                    Conversation newConversation = Conversation.builder()
                            .members(List.of(user, targetUser))
                            .build();
                    return conversationRepository.save(newConversation);
                });
    }

    public String getOrCreateAIConversation(String userEmail, String systemInstruction) {
        if (userEmail == null || userEmail.isEmpty()) {
            throw new RuntimeException("User ID is required to get or create an AI conversation.");
        }

        String convoId = userEmail;
        Object conversation = redisTemplate.opsForValue().get(convoId);

        if (conversation == null) {
            String defaultInstruction = "Bạn là một trợ lý tuyển dụng AI tên là Jarvis chuyên nghiệp và thân thiện. " +
                    "Nhiệm vụ của bạn là đưa ra tư vấn và lời khuyên hữu ích cho cả Ứng viên và Nhà tuyển dụng..." +
                    "Với bất kỳ hành vi nào cần đến userId, hãy sử dụng giá trị: " + userEmail;
            conversation = Map.of(
                "systemInstruction", systemInstruction != null ? systemInstruction : defaultInstruction,
                "messages", List.of(),
                "summary", ""
            );
            redisTemplate.opsForValue().set(convoId, conversation);
        }

        return convoId;
    }
}
