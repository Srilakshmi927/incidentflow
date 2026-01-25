package com.incidentflow.incidentflow.incident.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.incidentflow.incidentflow.incident.entity.Incident;

public interface IncidentRepository extends JpaRepository<Incident, Long> {
}
