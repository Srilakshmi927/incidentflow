package com.incidentflow.incidentflow.incident.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.incidentflow.incidentflow.incident.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop10ByOrderByCreatedAtDesc();

    List<Notification> findByIncidentIdOrderByCreatedAtDesc(Long incidentId);
}