package com.incidentflow.incidentflow.incident.controller;
import org.springframework.http.HttpStatus;
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

import jakarta.validation.Valid;
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
}
