package com.example.demo.repositories;

import com.example.demo.models.Conversation;
import com.example.demo.models.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends MongoRepository<Conversation, String> {
    @Query("{ 'members': { $all: ?0 } }")
    Optional<Conversation> findByMembersIn(List<User> members);
}
