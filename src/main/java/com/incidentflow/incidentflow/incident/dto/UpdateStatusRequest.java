package com.incidentflow.incidentflow.incident.dto;

import com.incidentflow.incidentflow.common.enums.IncidentStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class UpdateStatusRequest {

    @NotNull(message = "status is required")
    private IncidentStatus status;

    @NotBlank(message = "userRole is required")
    private String userRole;

    public IncidentStatus getStatus() { return status; }
    public void setStatus(IncidentStatus status) { this.status = status; }

    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }
}
