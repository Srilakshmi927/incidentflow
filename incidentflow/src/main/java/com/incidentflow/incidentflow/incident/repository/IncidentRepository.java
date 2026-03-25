package com.incidentflow.incidentflow.incident.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.incidentflow.incidentflow.common.enums.IncidentStatus;
import com.incidentflow.incidentflow.common.enums.Priority;
import com.incidentflow.incidentflow.incident.entity.Incident;

public interface IncidentRepository extends JpaRepository<Incident, Long> {
long countByStatus(IncidentStatus status);

long countByPriority(Priority priority);

    Page<Incident> findByStatus(IncidentStatus status, Pageable pageable);
    Page<Incident> findByTitleContainingIgnoreCase(String title, Pageable pageable);
    Page<Incident> findByPriority(Priority priority, Pageable pageable);

    Page<Incident> findByStatusAndPriority(IncidentStatus status, Priority priority, Pageable pageable);
    List<Incident> findByStatusNotAndSlaDeadlineBefore(IncidentStatus status, LocalDateTime time);
    @Query("""
SELECT i FROM Incident i
WHERE (:title IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%', :title, '%')))
AND (:status IS NULL OR i.status = :status)
AND (:priority IS NULL OR i.priority = :priority)
AND (:assignedTo IS NULL OR LOWER(i.assignedTo) LIKE LOWER(CONCAT('%', :assignedTo, '%')))
""")
Page<Incident> searchIncidents(
        @Param("title") String title,
        @Param("status") IncidentStatus status,
        @Param("priority") Priority priority,
        @Param("assignedTo") String assignedTo,
        Pageable pageable);
        
    
}
