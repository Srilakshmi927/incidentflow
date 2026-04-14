package com.incidentflow.incidentflow.incident.entity;
import java.time.Duration;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.incidentflow.incidentflow.common.enums.IncidentStatus;
import com.incidentflow.incidentflow.common.enums.Priority;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
@Entity
@Table(name = "incidents")
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String title;
@Column(name = "last_updated_by")
private String lastUpdatedBy;

@Column(name = "last_updated_at")
private java.time.LocalDateTime lastUpdatedAt;

    public Incident() {
    }

public String getLastUpdatedBy() { return lastUpdatedBy; }
public void setLastUpdatedBy(String lastUpdatedBy) { this.lastUpdatedBy = lastUpdatedBy; }

public java.time.LocalDateTime getLastUpdatedAt() { return lastUpdatedAt; }
public void setLastUpdatedAt(java.time.LocalDateTime lastUpdatedAt) { this.lastUpdatedAt = lastUpdatedAt; }

    @Column(nullable = false, length = 1000)
    private String description;
    @Column(name = "resolution_notes")
private String resolutionNotes;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IncidentStatus status = IncidentStatus.OPEN;
    @Column(name = "reopen_reason")
    private String reopenReason;
    @Column(length = 100)
    private String assignedTo;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
@Column
private LocalDateTime slaDeadline;
@Column(nullable = false)
private boolean slaBreached = false;


    public Long getId() { return id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getResolutionNotes() {
    return resolutionNotes;
}


public void setResolutionNotes(String resolutionNotes) {
    this.resolutionNotes = resolutionNotes;
}
public String getReopenReason() {
    return reopenReason;
}

public void setReopenReason(String reopenReason) {
    this.reopenReason = reopenReason;
}
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public IncidentStatus getStatus() { return status; }
    public void setStatus(IncidentStatus status) { this.status = status; }

    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getSlaDeadline() { return slaDeadline; }
public void setSlaDeadline(LocalDateTime slaDeadline) { this.slaDeadline = slaDeadline; }

public boolean isSlaBreached() { return slaBreached; }
public void setSlaBreached(boolean slaBreached) { this.slaBreached = slaBreached; }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Transient
@JsonProperty("slaRemainingMinutes")
public Long getSlaRemainingMinutes() {
    if (slaDeadline == null) return null;
    return Duration.between(LocalDateTime.now(), slaDeadline).toMinutes();
}

@Transient
@JsonProperty("slaDueSoon")
public boolean isSlaDueSoon() {
    Long mins = getSlaRemainingMinutes();
    return mins != null && mins > 0 && mins <= 60; // due within 1 hour
}

    public void setId(long id) {
        this.id = id;
    }

@Transient
private Long commentsCount;

@Transient
private Long historyCount;

public Long getCommentsCount() {
    return commentsCount;
}

public void setCommentsCount(Long commentsCount) {
    this.commentsCount = commentsCount;
}

public Long getHistoryCount() {
    return historyCount;
}

public void setHistoryCount(Long historyCount) {
    this.historyCount = historyCount;
}
}
