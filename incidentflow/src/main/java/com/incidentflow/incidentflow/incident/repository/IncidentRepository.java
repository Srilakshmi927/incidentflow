package com.incidentflow.incidentflow.incident.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.incidentflow.incidentflow.incident.entity.Incident;
import com.incidentflow.incidentflow.common.enums.IncidentStatus;
import com.incidentflow.incidentflow.common.enums.Priority;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


public interface IncidentRepository extends JpaRepository<Incident, Long> {
long countByStatus(IncidentStatus status);

long countByPriority(Priority priority);

    Page<Incident> findByStatus(IncidentStatus status, Pageable pageable);

    Page<Incident> findByPriority(Priority priority, Pageable pageable);

    Page<Incident> findByStatusAndPriority(IncidentStatus status, Priority priority, Pageable pageable);
}
