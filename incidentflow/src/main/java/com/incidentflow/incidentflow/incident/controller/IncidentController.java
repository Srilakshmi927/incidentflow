package com.incidentflow.incidentflow.incident.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.incidentflow.incidentflow.common.enums.IncidentStatus;
import com.incidentflow.incidentflow.common.enums.Priority;
import com.incidentflow.incidentflow.incident.dto.CreateIncidentRequest;
import com.incidentflow.incidentflow.incident.dto.DashboardSummary;
import com.incidentflow.incidentflow.incident.entity.Incident;
import com.incidentflow.incidentflow.incident.entity.IncidentActivity;
import com.incidentflow.incidentflow.incident.entity.IncidentComment;
import com.incidentflow.incidentflow.incident.service.IncidentService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

@Tag(name = "Incidents", description = "IncidentFlow APIs for creating, assigning, updating, and retrieving incidents")
@RestController
@RequestMapping("/api/incidents")
@CrossOrigin(origins = "http://127.0.0.1:5500", allowCredentials = "true")
public class IncidentController {

    private final IncidentService service;

    public IncidentController(IncidentService service) {
        this.service = service;
    }

    private String roleOrThrow(HttpSession session) {
        Object role = session.getAttribute("USER_ROLE");
        if (role == null) throw new RuntimeException("Not logged in");
        return role.toString();
    }
    private String requireRole(HttpSession session) {
    Object r = session.getAttribute("userRole");
    if (r == null) {
        throw new IllegalArgumentException("User role missing. Please login again.");
    }
    return String.valueOf(r);
}
    @Operation(summary = "Create an incident", description = "Creates a new incident with title, description and priority. Status defaults to OPEN.")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Incident create(@Valid @RequestBody CreateIncidentRequest req) {
        return service.createIncident(req);
    }

    @Operation(summary = "Assign an incident", description = "Assigns an incident to a user. Only ADMIN or SUPPORT roles are allowed.")
@PutMapping("/{id}/assign")
public Incident assignIncident(@PathVariable Long id,
                               @RequestParam String assignedTo,
                               @RequestParam String userRole,
                               HttpSession session) {
    return service.assignIncident(id, assignedTo, userRole);
}

@GetMapping("/{id}/activity")
public List<IncidentActivity> getIncidentActivity(@PathVariable Long id) {
    return service.getActivity(id);
}
    @Operation(summary = "List incidents", description = "Returns incidents with pagination/sorting and optional filters by status and priority.")
    @GetMapping
    public Page<Incident> getIncidents(
            @RequestParam(required = false) IncidentStatus status,
            @RequestParam(required = false) Priority priority,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return service.getIncidents(status, priority, pageable);
    }

    @GetMapping("/{id}")
    public Incident getById(@PathVariable Long id) {
        return service.getIncidentById(id);
    }

    @Operation(summary = "Update incident status", description = "Updates status using controlled workflow transitions.")
    @PutMapping("/{id}/status")
public Incident updateStatus(@PathVariable Long id,
                             @RequestParam IncidentStatus newStatus,
                             HttpSession session) {
    String userRole = requireRole(session);
    return service.updateStatus(id, newStatus, userRole);
}

   
    @PutMapping("/{id}")
public Incident updateIncident(@PathVariable Long id,
                               @RequestBody Incident updatedIncident,
                               HttpSession session) {
    String userRole = requireRole(session);
    return service.updateIncidentDetails(id, updatedIncident, userRole);
}

@DeleteMapping("/{id}")
public void deleteIncident(@PathVariable Long id, HttpSession session) {
    String userRole = requireRole(session);
    service.deleteIncident(id, userRole);
}

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardSummary> getDashboardSummary() {
        return ResponseEntity.ok(service.getDashboardSummary());
    }
    @PostMapping("/{id}/comments")
public IncidentComment addComment(@PathVariable Long id,
                                  @RequestParam String comment,
                                  @RequestParam String user) {

    return service.addComment(id, comment, user);
}
@GetMapping("/{id}/comments")
public List<IncidentComment> getComments(@PathVariable Long id) {
    return service.getComments(id);
}

@PutMapping("/comments/{commentId}")
public IncidentComment updateComment(@PathVariable Long commentId,
                                     @RequestParam String comment,
                                     @RequestParam String user) {
    return service.updateComment(commentId, comment, user);
}

@DeleteMapping("/comments/{commentId}")
public String deleteComment(@PathVariable Long commentId,
                            @RequestParam String user) {
    service.deleteComment(commentId, user);
    return "Comment deleted successfully";
}
@GetMapping("/search")
public Page<Incident> searchIncidents(@RequestParam String title, Pageable pageable) {
    return service.searchIncidentsByTitle(title, pageable);
}
}