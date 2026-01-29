package com.incidentflow.incidentflow;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class IncidentFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldCreateIncidentSuccessfully() throws Exception {
        String payload = """
            {
            "title": "Email failure",
            "description": "Outbound notifications not received",
            "priority": "HIGH"
            }
            """;

        mockMvc.perform(post("/api/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    @Test
    void shouldBlockInvalidStatusTransition() throws Exception {
        // 1) Create incident
        String createPayload = """
            {
              "title": "VPN issue",
              "description": "VPN not connecting",
              "priority": "MEDIUM"
            }
            """;

        String response = mockMvc.perform(post("/api/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createPayload))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        // (simple approach) assume first incident id=1 in test db
        String statusPayload = """
            {
              "status": "CLOSED",
              "userRole": "SUPPORT"
            }
            """;

        mockMvc.perform(put("/api/incidents/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(statusPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }
}
