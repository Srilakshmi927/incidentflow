package com.incidentflow.incidentflow.incident.controller;
import java.util.List;
import com.incidentflow.incidentflow.incident.dto.UpdateStatusRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.incidentflow.incidentflow.incident.dto.AssignIncidentRequest;
import com.incidentflow.incidentflow.incident.dto.CreateIncidentRequest;
import com.incidentflow.incidentflow.incident.entity.Incident;
import com.incidentflow.incidentflow.incident.service.IncidentService;
import com.incidentflow.incidentflow.common.enums.IncidentStatus;
import com.incidentflow.incidentflow.common.enums.Priority;
import org.springframework.web.bind.annotation.RequestParam;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService service;

    public IncidentController(IncidentService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Incident create(@Valid @RequestBody CreateIncidentRequest req) {
        return service.createIncident(req);
    }

    @PutMapping("/{id}/assign")
    public Incident assignIncident(@PathVariable Long id,@Valid @RequestBody AssignIncidentRequest request) {
        return service.assignIncident(id, request.getAssignedTo(), request.getUserRole());
    }
    

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
    @PutMapping("/{id}/status")
    public Incident updateStatus(@PathVariable Long id,@Valid @RequestBody UpdateStatusRequest request) {
        return service.updateStatus(id, request.getStatus(), request.getUserRole());
    }



}
