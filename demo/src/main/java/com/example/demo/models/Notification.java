package com.example.demo.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    @DBRef
    private User to;

    private String from; // ID of the source (e.g., Candidate ID or User ID)

    private String fromModel; // e.g., "Candidate" or "User"

    private NotificationType type;

    @Builder.Default
    private boolean isRead = false;

    private String displayName;

    // For NEW_APPLICATION type
    private String jobTitle;

    // For NEW_MESSAGE type
    @DBRef
    private Conversation conversation;

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;
}
