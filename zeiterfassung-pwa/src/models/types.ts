export interface Timestamp {
  id: string;
  time: string; // ISO string format
  isStartTimestamp: boolean;
  label?: string;
  comment?: string;
}

export interface DailyData {
  date: string; // YYYY-MM-DD format
  timestamps: Timestamp[];
}

export interface TimeSummary {
  label: string;
  duration: number; // Duration in milliseconds
}