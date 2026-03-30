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
import com.incidentflow.incidentflow.incident.entity.IncidentComment;
import com.incidentflow.incidentflow.incident.entity.Notification;
import com.incidentflow.incidentflow.incident.repository.IncidentActivityRepository;
import com.incidentflow.incidentflow.incident.repository.IncidentCommentRepository;
import com.incidentflow.incidentflow.incident.repository.IncidentRepository;
import com.incidentflow.incidentflow.incident.repository.NotificationRepository;

@Service
public class IncidentService {
    private final NotificationRepository notificationRepo;
    
private static final Logger log = LoggerFactory.getLogger(IncidentService.class);
private final IncidentCommentRepository commentRepo;
    private final IncidentRepository repo;
    private final IncidentActivityRepository activityRepo;
    public IncidentService(IncidentRepository repo, IncidentActivityRepository activityRepo,IncidentCommentRepository commentRepo, NotificationRepository notificationRepo) {
        this.repo = repo;
        this.activityRepo = activityRepo;
        this.commentRepo = commentRepo;
        this.notificationRepo = notificationRepo;
    }
public IncidentComment addComment(Long incidentId, String comment, String user) {

    Incident incident = repo.findById(incidentId)
            .orElseThrow(() -> new RuntimeException("Incident not found"));

    IncidentComment ic = new IncidentComment();
    ic.setIncidentId(incidentId);
    ic.setComment(comment);
    ic.setCreatedBy(user);

    return commentRepo.save(ic);
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
private void createNotification(Long incidentId, String message, String recipientRole) {
    Notification notification = new Notification();
    notification.setIncidentId(incidentId);
    notification.setMessage(message);
    notification.setRecipientRole(recipientRole);
    notificationRepo.save(notification);
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
            .orElseThrow(() -> new RuntimeException("Incident not found"));

    if (!userRole.equalsIgnoreCase("ADMIN") && !userRole.equalsIgnoreCase("SUPPORT")) {
        throw new RuntimeException("Only ADMIN or SUPPORT can assign incidents");
    }

    incident.setAssignedTo(assignedTo);
    incident.setLastUpdatedBy(userRole.toUpperCase());
    incident.setLastUpdatedAt(java.time.LocalDateTime.now());

    Incident saved = repo.save(incident);

    createNotification(id,
            "Incident #" + id + " assigned to " + assignedTo,
            userRole.toUpperCase());

    return saved;
}

public List<IncidentComment> getComments(Long incidentId) {
    return commentRepo.findByIncidentIdOrderByCreatedAtDesc(incidentId);
}
    public List<Incident> getAllIncidents() {
        return repo.findAll();
    }

    public Incident getIncidentById(Long id) {
        return repo.findById(id).orElseThrow(() -> new NotFoundException("Incident not found: " + id));

    }

    public IncidentComment updateComment(Long commentId, String newComment, String user) {

    if (!user.equalsIgnoreCase("ADMIN") && !user.equalsIgnoreCase("SUPPORT")) {
        throw new RuntimeException("Only ADMIN or SUPPORT can edit comments");
    }

    IncidentComment comment = commentRepo.findById(commentId)
            .orElseThrow(() -> new RuntimeException("Comment not found"));

    comment.setComment(newComment);

    return commentRepo.save(comment);
}

public void deleteComment(Long commentId, String user) {

    if (!user.equalsIgnoreCase("ADMIN") && !user.equalsIgnoreCase("SUPPORT")) {
        throw new RuntimeException("Only ADMIN or SUPPORT can delete comments");
    }

    IncidentComment comment = commentRepo.findById(commentId)
            .orElseThrow(() -> new RuntimeException("Comment not found"));

    commentRepo.delete(comment);
}
public Incident updateStatus(Long id,
                             IncidentStatus newStatus,
                             String userRole,
                             String resolutionNotes,
                             String reopenReason) {

    Incident incident = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Incident not found"));

    if (!userRole.equalsIgnoreCase("ADMIN") && !userRole.equalsIgnoreCase("SUPPORT")) {
        throw new RuntimeException("Only ADMIN or SUPPORT can update status");
    }

    if (incident.getAssignedTo() == null || incident.getAssignedTo().isBlank()) {
        throw new RuntimeException("Incident must be assigned before changing status");
    }

    IncidentStatus current = incident.getStatus();


            boolean valid =
    (current == IncidentStatus.OPEN && newStatus == IncidentStatus.IN_PROGRESS) ||
    (current == IncidentStatus.IN_PROGRESS && newStatus == IncidentStatus.RESOLVED) ||
    (current == IncidentStatus.RESOLVED && newStatus == IncidentStatus.CLOSED) ||
    (current == IncidentStatus.CLOSED && newStatus == IncidentStatus.REOPENED) ||
    (current == IncidentStatus.REOPENED && newStatus == IncidentStatus.IN_PROGRESS) ||
    (current == IncidentStatus.REOPENED && newStatus == IncidentStatus.CLOSED);

    if (!valid) {
        throw new RuntimeException("Invalid status transition: " + current + " -> " + newStatus);
    }

    if (newStatus == IncidentStatus.CLOSED) {
        if (resolutionNotes == null || resolutionNotes.isBlank()) {
            throw new RuntimeException("Resolution notes are required before closing the incident");
        }
        incident.setResolutionNotes(resolutionNotes);
    }

    if (newStatus == IncidentStatus.REOPENED) {
        if (reopenReason == null || reopenReason.isBlank()) {
            throw new RuntimeException("Reopen reason is required to reopen the incident");
        }
        incident.setReopenReason(reopenReason);
    }

    incident.setStatus(newStatus);
    incident.setLastUpdatedBy(userRole.toUpperCase());
    incident.setLastUpdatedAt(java.time.LocalDateTime.now());

    Incident saved = repo.save(incident);

    createNotification(id,
            "Incident #" + id + " status changed to " + newStatus,
            userRole.toUpperCase());

    return saved;
}
public List<Notification> getRecentNotifications() {
    return notificationRepo.findTop10ByOrderByCreatedAtDesc();
}

public List<Notification> getNotificationsByIncident(Long incidentId) {
    return notificationRepo.findByIncidentIdOrderByCreatedAtDesc(incidentId);
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

public Page<Incident> searchIncidentsByTitle(String title, Pageable pageable) {

    if (title == null || title.isBlank()) {
        return repo.findAll(pageable);
    }

    return repo.findByTitleContainingIgnoreCase(title.trim(), pageable);
}

public Page<Incident> searchIncidents(String title,
                                      IncidentStatus status,
                                      Priority priority,
                                      String assignedTo,
                                      Pageable pageable) {
    return repo.searchIncidents(title, status, priority, assignedTo, pageable);
}



}