package com.incidentflow.incidentflow.incident.dto;

public class AiSummaryResponse {

    private String summary;

    public AiSummaryResponse() {
    }

    public AiSummaryResponse(String summary) {
        this.summary = summary;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }
}