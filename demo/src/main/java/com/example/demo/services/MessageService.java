package com.example.demo.services;

import com.example.demo.models.Conversation;
import com.example.demo.models.Message;
import com.example.demo.models.NotificationType;
import com.example.demo.models.User;
import com.example.demo.repositories.ConversationRepository;
import com.example.demo.repositories.MessageRepository;
import com.example.demo.repositories.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SocketService socketService;

    public MessageService(MessageRepository messageRepository, ConversationRepository conversationRepository, UserRepository userRepository, NotificationService notificationService, SocketService socketService) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.socketService = socketService;
    }

    public List<Message> getMessages(String conversationId, int limit, Date before) {
        if (conversationId == null || conversationId.isEmpty()) {
            throw new RuntimeException("Conversation ID is required");
        }

        Conversation conversation = conversationRepository.findById(conversationId).orElseThrow(() -> new RuntimeException("Conversation not found"));
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        if(before != null){
            return messageRepository.findByConversationAndCreatedAtBefore(conversation, before, pageable);
        }
        return messageRepository.findByConversation(conversation, pageable);
    }

    public Message sendMessage(String userEmail, String conversationId, String text) {
        if (userEmail == null || userEmail.isEmpty() || text == null || text.isEmpty() || conversationId == null || conversationId.isEmpty()) {
            throw new RuntimeException("Invalid payload");
        }

        User sender = userRepository.findByEmail(userEmail).orElseThrow(() -> new RuntimeException("User not found"));
        Conversation conversation = conversationRepository.findById(conversationId).orElseThrow(() -> new RuntimeException("Conversation not found"));

        Message newMessage = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .text(text)
                .createdAt(new Date())
                .build();
        messageRepository.save(newMessage);

        Conversation.MessageInfo lastMessage = new Conversation.MessageInfo(text, sender, newMessage.getCreatedAt());
        conversation.setLastMessage(lastMessage);
        conversationRepository.save(conversation);

        // Populate sender information before emitting
        socketService.emitNewMessage(conversationId, newMessage);

        // Create notification for the recipient
        User recipient = conversation.getMembers().stream().filter(p -> !p.getId().equals(sender.getId())).findFirst().orElse(null);
        if (recipient != null) {
            notificationService.createNotification(
                    recipient,
                    sender.getId(),
                    "User",
                    NotificationType.NEW_MESSAGE,
                    sender.getEmail().split("@")[0],
                    null,
                    conversation
            );
            socketService.emitNewNotification(recipient.getId(), "You have a new message");
        }

        return newMessage;
    }
}
