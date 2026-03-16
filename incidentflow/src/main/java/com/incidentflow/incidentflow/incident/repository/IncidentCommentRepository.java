package com.incidentflow.incidentflow.incident.repository;

import com.incidentflow.incidentflow.incident.entity.IncidentComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncidentCommentRepository extends JpaRepository<IncidentComment, Long> {

    List<IncidentComment> findByIncidentIdOrderByCreatedAtDesc(Long incidentId);
}