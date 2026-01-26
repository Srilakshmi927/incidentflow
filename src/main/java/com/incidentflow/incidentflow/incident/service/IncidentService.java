package com.incidentflow.incidentflow.incident.service;
import java.util.List;
import com.incidentflow.incidentflow.common.enums.IncidentStatus;

import org.springframework.stereotype.Service;

import com.incidentflow.incidentflow.incident.dto.CreateIncidentRequest;
import com.incidentflow.incidentflow.incident.entity.Incident;
import com.incidentflow.incidentflow.incident.repository.IncidentRepository;

@Service
public class IncidentService {

    private final IncidentRepository repo;

    public IncidentService(IncidentRepository repo) {
        this.repo = repo;
    }

    public Incident createIncident(CreateIncidentRequest req) {
        Incident incident = new Incident();
        incident.setTitle(req.getTitle());
        incident.setDescription(req.getDescription());
        incident.setPriority(req.getPriority());
        return repo.save(incident);
    }
    public Incident assignIncident(Long id, String assignedTo, String userRole) {
    Incident incident = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Incident not found with id: " + id));

    // Simple role validation (simulate real-time rule)
    if (!userRole.equalsIgnoreCase("ADMIN") && !userRole.equalsIgnoreCase("SUPPORT")) {
        throw new RuntimeException("User role is not authorized to assign incidents: " + userRole);
    }

    incident.setAssignedTo(assignedTo);
    return repo.save(incident);
    }


    public List<Incident> getAllIncidents() {
        return repo.findAll();
    }

    public Incident getIncidentById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident not found with id: " + id));
    }


    public Incident updateStatus(Long id, IncidentStatus newStatus, String userRole) {

        Incident incident = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident not found with id: " + id));

        if (!userRole.equalsIgnoreCase("ADMIN") && !userRole.equalsIgnoreCase("SUPPORT")) {
            throw new RuntimeException("User role is not authorized to update status: " + userRole);
        }

        IncidentStatus current = incident.getStatus();

        // block changes after CLOSED
        if (current == IncidentStatus.CLOSED) {
            throw new RuntimeException("Incident is CLOSED and cannot be updated");
        }

        // Allowed workflow transitions
        boolean valid =
                (current == IncidentStatus.OPEN && newStatus == IncidentStatus.IN_PROGRESS) ||
                (current == IncidentStatus.IN_PROGRESS && newStatus == IncidentStatus.RESOLVED) ||
                (current == IncidentStatus.RESOLVED && newStatus == IncidentStatus.CLOSED);

        if (!valid) {
            throw new RuntimeException("Invalid status transition: " + current + " -> " + newStatus);
        }

        incident.setStatus(newStatus);
        return repo.save(incident);
    }

}