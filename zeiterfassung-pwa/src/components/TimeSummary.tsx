import React from 'react';
import { 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow 
} from '@mui/material';
import { TimeSummary as TimeSummaryType } from '../models/types';
import { formatDuration } from '../utils/timeUtils';

interface TimeSummaryProps {
  summaries: TimeSummaryType[];
}

export const TimeSummary: React.FC<TimeSummaryProps> = ({ summaries }) => {
  // Calculate total duration
  const totalDuration = summaries.reduce((total, summary) => total + summary.duration, 0);

  if (summaries.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 2, mt: 2, backgroundColor: '#f5f5f5' }}>
        <Typography variant="body1" align="center" role="status">
          No time data available. Add at least two timestamps to see the summary.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ mt: 2, overflow: 'auto' }}>
      <Typography variant="h6" sx={{ p: 2, pb: 1 }} id="time-summary-title">
        Time Summary
      </Typography>
      <Table aria-labelledby="time-summary-title">
        <TableHead>
          <TableRow>
            <TableCell scope="col">Label</TableCell>
            <TableCell scope="col">Duration</TableCell>
            <TableCell scope="col">Percentage</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {summaries.map((summary) => (
            <TableRow key={summary.label}>
              <TableCell>{summary.label}</TableCell>
              <TableCell aria-label={`Duration: ${formatDuration(summary.duration)}`}>
                {formatDuration(summary.duration)}
              </TableCell>
              <TableCell aria-label={`${Math.round((summary.duration / totalDuration) * 100)}% of total time`}>
                {totalDuration > 0
                  ? `${Math.round((summary.duration / totalDuration) * 100)}%`
                  : '0%'}
              </TableCell>
            </TableRow>
          ))}
          <TableRow sx={{ '& td': { fontWeight: 'bold', bgcolor: '#f5f5f5' } }}>
            <TableCell>Total</TableCell>
            <TableCell aria-label={`Total duration: ${formatDuration(totalDuration)}`}>
              {formatDuration(totalDuration)}
            </TableCell>
            <TableCell>100%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Paper>
  );
};