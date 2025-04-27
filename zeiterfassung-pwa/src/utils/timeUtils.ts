import { DailyData, Timestamp, TimeSummary } from '../models/types';

// Format a date as YYYY-MM-DD
export const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

// Format time as HH:MM:SS
export const formatTime = (date: Date): string => {
    return date.toTimeString().split(' ')[0];
};

// Format duration in milliseconds to HH:MM:SS
export const formatDuration = (durationMs: number): string => {
    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':');
};

// Calculate time summaries for a day's timestamps
export const calculateTimeSummaries = (timestamps: Timestamp[]): TimeSummary[] => {
    if (!timestamps || timestamps.length < 2) {
        return [];
    }

    const sortedTimestamps = [...timestamps].sort((a, b) =>
        new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    const summaries: Record<string, number> = {};

    let lastTimestamp: Timestamp | null = null;

    sortedTimestamps.forEach((timestamp) => {
        if (lastTimestamp && !timestamp.isStartTimestamp) {
            const startTime = new Date(lastTimestamp.time).getTime();
            const endTime = new Date(timestamp.time).getTime();
            const duration = endTime - startTime;

            // If this timestamp has a label, use it for the previous interval
            // Otherwise use the last label
            const label = timestamp.label || 'Unlabeled';

            // Add duration to the label's summary
            summaries[label] = (summaries[label] || 0) + duration;
        }

        // Update last timestamp
        lastTimestamp = timestamp;
    });

    // Convert summaries object to array
    return Object.entries(summaries).map(([label, duration]) => ({
        label,
        duration
    }));
};

// Generate a unique ID
export const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};