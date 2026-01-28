package com.incidentflow.incidentflow.incident.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.incidentflow.incidentflow.incident.entity.Incident;
import java.util.List;
import com.incidentflow.incidentflow.common.enums.IncidentStatus;
import com.incidentflow.incidentflow.common.enums.Priority;

public interface IncidentRepository extends JpaRepository<Incident, Long> {

    List<Incident> findByStatus(IncidentStatus status);

    List<Incident> findByPriority(Priority priority);
}
