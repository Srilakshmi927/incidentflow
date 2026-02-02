package com.incidentflow.incidentflow.incident.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AssignIncidentRequest {

    @NotBlank(message = "assignedTo is required")
    @Size(max = 100, message = "assignedTo must be <= 100 characters")
    private String assignedTo;

    @NotBlank(message = "userRole is required")
    @Size(max = 30, message = "userRole must be <= 30 characters")
    private String userRole;

    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }

    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }
}
