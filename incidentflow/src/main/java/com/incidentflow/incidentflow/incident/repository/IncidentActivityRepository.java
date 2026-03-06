package com.incidentflow.incidentflow.incident.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.incidentflow.incidentflow.incident.entity.IncidentActivity;

public interface IncidentActivityRepository extends JpaRepository<IncidentActivity, Long> {

    List<IncidentActivity> findByIncidentIdOrderByCreatedAtDesc(Long incidentId);

}