package com.incidentflow.incidentflow.incident.service;
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

}