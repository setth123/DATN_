package com.example.demo.repositories;

import com.example.demo.models.Conversation;
import com.example.demo.models.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Date;
import java.util.List;

public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findByConversationAndCreatedAtBefore(Conversation conversation, Date before, Pageable pageable);
    List<Message> findByConversation(Conversation conversation, Pageable pageable);
}
