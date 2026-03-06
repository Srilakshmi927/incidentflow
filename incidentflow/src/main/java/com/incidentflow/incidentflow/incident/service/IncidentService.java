package com.incidentflow.incidentflow.incident.service;
import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.incidentflow.incidentflow.common.enums.IncidentStatus;
import com.incidentflow.incidentflow.common.enums.Priority;
import com.incidentflow.incidentflow.common.exception.BadRequestException;
import com.incidentflow.incidentflow.common.exception.ForbiddenException;
import com.incidentflow.incidentflow.common.exception.NotFoundException;
import com.incidentflow.incidentflow.incident.dto.CreateIncidentRequest;
import com.incidentflow.incidentflow.incident.dto.DashboardSummary;
import com.incidentflow.incidentflow.incident.entity.Incident;
import com.incidentflow.incidentflow.incident.entity.IncidentActivity;
import com.incidentflow.incidentflow.incident.repository.IncidentActivityRepository;
import com.incidentflow.incidentflow.incident.repository.IncidentRepository;


@Service
public class IncidentService {
private static final Logger log = LoggerFactory.getLogger(IncidentService.class);

    private final IncidentRepository repo;
    private final IncidentActivityRepository activityRepo;
    public IncidentService(IncidentRepository repo, IncidentActivityRepository activityRepo) {
        this.repo = repo;
        this.activityRepo = activityRepo;
    }

    private void logActivity(Long incidentId, String action, String user) {

    IncidentActivity activity = new IncidentActivity();
    activity.setIncidentId(incidentId);
    activity.setAction(action);
    activity.setPerformedBy(user);

    activityRepo.save(activity);
}
    private LocalDateTime calculateSla(Priority priority) {
    LocalDateTime now = LocalDateTime.now();

    return switch (priority) {
        case HIGH -> now.plusHours(4);
        case MEDIUM -> now.plusHours(12);
        case LOW -> now.plusHours(24);
        default -> now.plusHours(24);
    };
}

public Incident createIncident(CreateIncidentRequest req) {
    Incident incident = new Incident();
    incident.setTitle(req.getTitle());
    incident.setDescription(req.getDescription());
    incident.setPriority(req.getPriority());
    incident.setStatus(IncidentStatus.OPEN);

    LocalDateTime deadline = calculateSla(req.getPriority());
    incident.setSlaDeadline(deadline);
    incident.setSlaBreached(false);

    return repo.save(incident);
}

    public Incident assignIncident(Long id, String assignedTo, String userRole) {
        
    Incident incident = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Incident not found with id: " + id));


    // Simple role validation (simulate real-time rule)
    if (!userRole.equalsIgnoreCase("ADMIN") && !userRole.equalsIgnoreCase("SUPPORT")) {
        throw new ForbiddenException("User role is not authorized to assign incidents: " + userRole);

    }

    incident.setAssignedTo(assignedTo);
incident.setLastUpdatedBy(userRole.toUpperCase());
incident.setLastUpdatedAt(java.time.LocalDateTime.now());


repo.save(incident);

logActivity(id, "Assigned to " + assignedTo, userRole);

return incident;
    }


    public List<Incident> getAllIncidents() {
        return repo.findAll();
    }

    public Incident getIncidentById(Long id) {
        return repo.findById(id).orElseThrow(() -> new NotFoundException("Incident not found: " + id));

    }

    
    public Incident updateStatus(Long id, IncidentStatus newStatus, String userRole) {

    Incident incident = repo.findById(java.util.Objects.requireNonNull(id))
            .orElseThrow(() -> new NotFoundException("Incident not found with id: " + id));

    // Role validation
    if (!userRole.equalsIgnoreCase("ADMIN") && !userRole.equalsIgnoreCase("SUPPORT")) {
        throw new ForbiddenException("User role is not authorized to update status: " + userRole);
    }

    if (incident.getAssignedTo() == null || incident.getAssignedTo().isBlank()) {
        throw new BadRequestException(
                "Incident must be assigned before changing status"
        );
    }

    IncidentStatus current = incident.getStatus();

    // block changes after CLOSED
    if (current == IncidentStatus.CLOSED) {
        throw new BadRequestException("Incident is CLOSED and cannot be updated");
    }

    // Allowed workflow transitions
    boolean valid =
            (current == IncidentStatus.OPEN && newStatus == IncidentStatus.IN_PROGRESS) ||
            (current == IncidentStatus.IN_PROGRESS && newStatus == IncidentStatus.RESOLVED) ||
            (current == IncidentStatus.RESOLVED && newStatus == IncidentStatus.CLOSED);

    if (!valid) {
        throw new BadRequestException("Invalid status transition: " + current + " -> " + newStatus);
    }

    incident.setStatus(newStatus);
    incident.setLastUpdatedBy(userRole.toUpperCase());
incident.setLastUpdatedAt(java.time.LocalDateTime.now());
logActivity(id, "Status changed to " + newStatus, userRole);
    return repo.save(incident);
}
public List<IncidentActivity> getActivity(Long incidentId) {
    return activityRepo.findByIncidentIdOrderByCreatedAtDesc(incidentId);
}
private void evaluateSla(Incident incident) {

    if (incident == null) return;

    if (incident.getSlaDeadline() == null) {
        LocalDateTime base = incident.getCreatedAt() != null
                ? incident.getCreatedAt()
                : LocalDateTime.now();

        LocalDateTime deadline = switch (incident.getPriority()) {
            case HIGH -> base.plusHours(4);
            case MEDIUM -> base.plusHours(12);
            case LOW -> base.plusHours(24);
            default -> base.plusHours(24);
        };

        incident.setSlaDeadline(deadline);
    }

    if (incident.getStatus() != IncidentStatus.CLOSED &&
        LocalDateTime.now().isAfter(incident.getSlaDeadline())) {

        incident.setSlaBreached(true);
    } else {
        incident.setSlaBreached(false);
    }
}
public Page<Incident> getIncidents(IncidentStatus status, Priority priority, Pageable pageable) {

    Page<Incident> page;

    if (status != null && priority != null) {
        page = repo.findByStatusAndPriority(status, priority, pageable);
    } else if (status != null) {
        page = repo.findByStatus(status, pageable);
    } else if (priority != null) {
        page = repo.findByPriority(priority, pageable);
    } else {
        page = repo.findAll(pageable);
    }

    // Evaluate SLA for each incident
    page.getContent().forEach(this::evaluateSla);

    return page;
}

public void deleteIncident(Long id, String userRole) {

    if (!userRole.equalsIgnoreCase("ADMIN")) {
        throw new ForbiddenException("Only ADMIN can delete incidents");
    }

    Incident incident = repo.findById(id)
            .orElseThrow(() -> new NotFoundException("Incident not found with id: " + id));

    if (incident.getStatus() != IncidentStatus.CLOSED) {
        throw new BadRequestException(
            "Only CLOSED incidents can be deleted. Current status: " + incident.getStatus()
        );
    }

    repo.delete(incident);
}
public Incident updateIncidentDetails(Long id, Incident updatedIncident, String userRole) {

    if (!userRole.equalsIgnoreCase("ADMIN") &&
        !userRole.equalsIgnoreCase("SUPPORT")) {
        throw new ForbiddenException("Only ADMIN or SUPPORT can edit incidents");
    }

    Incident existing = repo.findById(id)
            .orElseThrow(() -> new NotFoundException("Incident not found with id: " + id));

    if (existing.getStatus() == IncidentStatus.CLOSED) {
        throw new BadRequestException("Closed incidents cannot be edited");
    }

    if (updatedIncident.getTitle() == null || updatedIncident.getTitle().isBlank()) {
        throw new BadRequestException("Title cannot be empty");
    }

    existing.setTitle(updatedIncident.getTitle());
    existing.setDescription(updatedIncident.getDescription());
    existing.setPriority(updatedIncident.getPriority());
existing.setLastUpdatedBy(userRole.toUpperCase());
existing.setLastUpdatedAt(java.time.LocalDateTime.now());

    return repo.save(existing);
}
public DashboardSummary getDashboardSummary() {

    long total = repo.count();
    long open = repo.countByStatus(IncidentStatus.OPEN);
    long inProgress = repo.countByStatus(IncidentStatus.IN_PROGRESS);
    long resolved = repo.countByStatus(IncidentStatus.RESOLVED);
    long closed = repo.countByStatus(IncidentStatus.CLOSED);
    long highPriority = repo.countByPriority(Priority.HIGH);

    return new DashboardSummary(total, open, inProgress, resolved, closed, highPriority);
}




}