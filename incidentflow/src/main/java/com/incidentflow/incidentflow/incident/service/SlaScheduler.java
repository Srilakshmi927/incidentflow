package com.incidentflow.incidentflow.incident.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.incidentflow.incidentflow.common.enums.IncidentStatus;
import com.incidentflow.incidentflow.incident.entity.Incident;
import com.incidentflow.incidentflow.incident.repository.IncidentRepository;

@Component
public class SlaScheduler {

    private final IncidentRepository repo;

    public SlaScheduler(IncidentRepository repo) {
        this.repo = repo;
    }

    // Runs every 5 minutes
    @Scheduled(fixedRate = 300000)
    public void updateSlaBreaches() {

        List<Incident> candidates =
                repo.findByStatusNotAndSlaDeadlineBefore(IncidentStatus.CLOSED, LocalDateTime.now());

        for (Incident i : candidates) {
            if (!i.isSlaBreached()) {
                i.setSlaBreached(true);
            }
        }

        if (!candidates.isEmpty()) {
            repo.saveAll(candidates);
        }
    }
}
