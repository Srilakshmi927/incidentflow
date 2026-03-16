package com.incidentflow.incidentflow.incident.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.incidentflow.incidentflow.incident.entity.Incident;
import com.incidentflow.incidentflow.incident.service.IncidentService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.incidentflow.incidentflow.common.enums.IncidentStatus;
import com.incidentflow.incidentflow.common.enums.Priority;

@WebMvcTest(IncidentController.class)
class IncidentControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private IncidentService incidentService;

    @Test
    void createIncident_shouldReturnCreatedIncident() throws Exception {

        Incident created = new Incident();
        ReflectionTestUtils.setField(created, "id", 10L); // ✅ avoids calling setId()
        created.setTitle("VPN issue");
        created.setDescription("VPN not connecting");
        created.setPriority(Priority.HIGH);
        created.setStatus(IncidentStatus.OPEN);

        // IMPORTANT: adjust this stub to match your service method signature
        // If your controller calls incidentService.createIncident(request), use that signature here.
        when(incidentService.createIncident(any())).thenReturn(created);

        String requestJson = """
                {"title":"VPN issue","description":"VPN not connecting","priority":"HIGH"}
                """;

        mockMvc.perform(post("/api/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated())               // ✅ 201
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.title").value("VPN issue"))
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    @Test
    void getIncidentById_shouldReturnIncident() throws Exception {

        Incident incident = new Incident();
        ReflectionTestUtils.setField(incident, "id", 10L);
        incident.setTitle("Email issue");
        incident.setDescription("Email not syncing");
        incident.setPriority(Priority.MEDIUM);
        incident.setStatus(IncidentStatus.OPEN);

        when(incidentService.getIncidentById(10L)).thenReturn(incident);

        mockMvc.perform(get("/api/incidents/10"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.title").value("Email issue"));
    }


    @Test
void assignIncident_shouldReturnUpdatedIncident() throws Exception {

    Incident updated = new Incident();
    updated.setId(1L);
    updated.setAssignedTo("kiran");

    when(incidentService.assignIncident(1L, "kiran", "SUPPORT")).thenReturn(updated);

    mockMvc.perform(put("/api/incidents/{id}/assign", 1L)
            .param("assignedTo", "kiran")
            .param("userRole", "SUPPORT")
            .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.assignedTo").value("kiran"));
}
}