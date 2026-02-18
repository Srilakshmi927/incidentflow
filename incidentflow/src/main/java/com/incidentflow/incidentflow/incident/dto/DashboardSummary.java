package com.incidentflow.incidentflow.incident.dto;

public class DashboardSummary {

    private long total;
    private long open;
    private long inProgress;
    private long resolved;
    private long closed;
    private long highPriority;

    public DashboardSummary(long total, long open, long inProgress,
                            long resolved, long closed, long highPriority) {
        this.total = total;
        this.open = open;
        this.inProgress = inProgress;
        this.resolved = resolved;
        this.closed = closed;
        this.highPriority = highPriority;
    }

    public long getTotal() { return total; }
    public long getOpen() { return open; }
    public long getInProgress() { return inProgress; }
    public long getResolved() { return resolved; }
    public long getClosed() { return closed; }
    public long getHighPriority() { return highPriority; }
}
