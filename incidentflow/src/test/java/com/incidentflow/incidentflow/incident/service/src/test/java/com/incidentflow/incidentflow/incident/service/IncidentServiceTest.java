package com.incidentflow.incidentflow.incident.service.src.test.java.com.incidentflow.incidentflow.incident.service;

import java.util.Optional;
import static java.util.Optional.of;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.incidentflow.incidentflow.common.enums.IncidentStatus;
import com.incidentflow.incidentflow.incident.entity.Incident;
import com.incidentflow.incidentflow.incident.repository.IncidentRepository;
import com.incidentflow.incidentflow.incident.service.IncidentService;

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
    incident.setAssignedTo("team1");

    when(repo.findById(1L)).thenReturn(of(incident));
    when(repo.save(any(Incident.class))).thenAnswer(invocation -> invocation.getArgument(0));

    Incident updated = service.updateStatus(1L, IncidentStatus.IN_PROGRESS, "SUPPORT", null);

    assertEquals(IncidentStatus.IN_PROGRESS, updated.getStatus());
}

@Test
void shouldBlockInvalidStatusTransition() {
    Incident incident = new Incident();
    incident.setStatus(IncidentStatus.IN_PROGRESS);
    incident.setAssignedTo("team1");

    when(repo.findById(1L)).thenReturn(Optional.of(incident));

    RuntimeException ex = assertThrows(RuntimeException.class, () ->
            service.updateStatus(1L, IncidentStatus.CLOSED, "SUPPORT", "Test resolution")
    );

    assertTrue(ex.getMessage().contains("Invalid status transition"));
}
}

