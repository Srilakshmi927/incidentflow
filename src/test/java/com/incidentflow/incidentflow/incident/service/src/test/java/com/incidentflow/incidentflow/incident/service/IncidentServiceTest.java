package com.incidentflow.incidentflow.incident.service.src.test.java.com.incidentflow.incidentflow.incident.service;

import com.incidentflow.incidentflow.common.enums.IncidentStatus;
import com.incidentflow.incidentflow.incident.entity.Incident;
import com.incidentflow.incidentflow.incident.repository.IncidentRepository;
import com.incidentflow.incidentflow.incident.service.IncidentService;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IncidentServiceTest {

    @Mock
    private IncidentRepository repo;

    @InjectMocks
    private IncidentService service;

    @Test
    void shouldAllowValidStatusTransition() {
        Incident incident = new Incident();
        incident.setStatus(IncidentStatus.OPEN);

        when(repo.findById(1L)).thenReturn(Optional.of(incident));
        when(repo.save(any(Incident.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Incident updated = service.updateStatus(1L, IncidentStatus.IN_PROGRESS, "SUPPORT");

        assertEquals(IncidentStatus.IN_PROGRESS, updated.getStatus());
    }

    @Test
    void shouldBlockInvalidStatusTransition() {
        Incident incident = new Incident();
        incident.setStatus(IncidentStatus.IN_PROGRESS);

        when(repo.findById(1L)).thenReturn(Optional.of(incident));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                service.updateStatus(1L, IncidentStatus.CLOSED, "SUPPORT")
        );

        assertTrue(ex.getMessage().contains("Invalid status transition"));
    }
}

