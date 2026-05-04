package com.fillos.backend.config;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void notifyRestaurant(Object payload) {
        messagingTemplate.convertAndSend("/topic/restaurant", payload);
    }

    public void notifyDelivery(Object payload) {
        messagingTemplate.convertAndSend("/topic/delivery", payload);
    }

    public void notifyUser(String userId, Object payload) {
        messagingTemplate.convertAndSend("/topic/user/" + userId, payload);
    }
}
