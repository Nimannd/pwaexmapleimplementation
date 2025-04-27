import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  Paper, 
  Typography, 
  Chip, 
  IconButton,
  Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FlagIcon from '@mui/icons-material/Flag';
import { Timestamp } from '../models/types';

interface TimestampListProps {
  timestamps: Timestamp[];
  onDelete: (id: string) => void;
}

export const TimestampList: React.FC<TimestampListProps> = ({ timestamps, onDelete }) => {
  // Sort timestamps by time
  const sortedTimestamps = [...timestamps].sort((a, b) => 
    new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  if (sortedTimestamps.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
        <Typography variant="body1" align="center" role="status">
          No timestamps added yet. Click the "+" button to add your first timestamp.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2}>
      <List 
        aria-label="Timestamps list"
        role="list"
      >
        {sortedTimestamps.map((timestamp) => {
          const date = new Date(timestamp.time);
          const timeString = date.toTimeString().slice(0, 8);
          const isStartMarker = timestamp.isStartTimestamp ? 'Start timestamp: ' : '';
          const ariaLabel = `${isStartMarker}${timeString}${timestamp.label ? ', Label: ' + timestamp.label : ''}${timestamp.comment ? ', Comment: ' + timestamp.comment : ''}`;

          return (
            <ListItem
              key={timestamp.id}
              role="listitem"
              aria-label={ariaLabel}
              secondaryAction={
                <IconButton 
                  edge="end" 
                  aria-label={`Delete timestamp at ${timeString}`} 
                  onClick={() => onDelete(timestamp.id)}
                >
                  <DeleteIcon />
                </IconButton>
              }
              sx={{ 
                borderLeft: timestamp.isStartTimestamp ? '4px solid #4caf50' : 'none',
                bgcolor: timestamp.isStartTimestamp ? '#e8f5e9' : 'inherit'
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', mr: 1 }}>
                      {timeString}
                    </Typography>
                    {timestamp.isStartTimestamp && (
                      <FlagIcon 
                        color="success" 
                        fontSize="small" 
                        sx={{ mr: 1 }} 
                        aria-label="Start timestamp marker"
                        role="img"
                      />
                    )}
                    {timestamp.label && (
                      <Chip 
                        label={timestamp.label} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                        aria-label={`Label: ${timestamp.label}`}
                      />
                    )}
                  </Box>
                }
                secondary={timestamp.comment}
                secondaryTypographyProps={{
                  'aria-label': timestamp.comment ? `Comment: ${timestamp.comment}` : undefined
                }}
              />
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
};