package com.example.demo.repositories;

import com.example.demo.models.Notification;
import com.example.demo.models.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByToOrderByCreatedAtDesc(User to);
    List<Notification> findByTo(User to);
}
