package com.incidentflow.incidentflow.incident.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.incidentflow.incidentflow.incident.entity.IncidentComment;

public interface IncidentCommentRepository extends JpaRepository<IncidentComment, Long> {
 long countByIncidentId(Long incidentId);
    List<IncidentComment> findByIncidentIdOrderByCreatedAtDesc(Long incidentId);
}