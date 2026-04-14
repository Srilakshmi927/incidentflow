package com.incidentflow.incidentflow.incident.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.incidentflow.incidentflow.incident.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
long countByIncidentId(Long incidentId);
    List<Notification> findTop10ByOrderByCreatedAtDesc();
List<Notification> findByIncidentIdOrderByCreatedAtAsc(Long incidentId);
    List<Notification> findByIncidentIdOrderByCreatedAtDesc(Long incidentId);
}