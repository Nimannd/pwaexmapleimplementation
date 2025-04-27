import React, { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  TextField, 
  FormControlLabel, 
  Switch,
  Autocomplete
} from '@mui/material';
import { Timestamp } from '../models/types';
import { generateId } from '../utils/timeUtils';

interface AddTimestampProps {
  open: boolean;
  onClose: () => void;
  onAdd: (timestamp: Timestamp) => void;
  isFirst: boolean;
  existingLabels: string[];
}

export const AddTimestamp: React.FC<AddTimestampProps> = ({ 
  open, 
  onClose, 
  onAdd, 
  isFirst, 
  existingLabels 
}) => {
  const now = new Date();
  const timeString = now.toTimeString().slice(0, 8);
  
  const [time, setTime] = useState(timeString);
  const [isStartTimestamp, setIsStartTimestamp] = useState(isFirst);
  const [label, setLabel] = useState('');
  const [comment, setComment] = useState('');

  const handleAdd = () => {
    // Create timestamp with current date but specified time
    const [hours, minutes, seconds] = time.split(':').map(Number);
    const timestamp = new Date();
    timestamp.setHours(hours, minutes, seconds);
    
    const newTimestamp: Timestamp = {
      id: generateId(),
      time: timestamp.toISOString(),
      isStartTimestamp,
      label: label || undefined,
      comment: comment || undefined
    };
    
    onAdd(newTimestamp);
    resetForm();
    onClose();
  };
  
  const resetForm = () => {
    const now = new Date();
    setTime(now.toTimeString().slice(0, 8));
    setIsStartTimestamp(isFirst);
    setLabel('');
    setComment('');
  };

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="add-timestamp-dialog-title">
      <DialogTitle id="add-timestamp-dialog-title">
        Add New Timestamp
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="time"
          label="Time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          fullWidth
          inputProps={{
            step: 1, // Allow seconds input
          }}
          sx={{ mb: 2 }}
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={isStartTimestamp}
              onChange={(e) => setIsStartTimestamp(e.target.checked)}
              name="isStartTimestamp"
            />
          }
          label="Start Timestamp (Marks the beginning of a tracking period)"
          sx={{ mb: 2 }}
        />

        <Autocomplete
          freeSolo
          id="label"
          options={existingLabels}
          value={label}
          onChange={(_, newValue) => setLabel(newValue || '')}
          onInputChange={(_, newInputValue) => setLabel(newInputValue)}
          renderInput={(params) => (
            <TextField {...params} label="Label" fullWidth sx={{ mb: 2 }} />
          )}
        />

        <TextField
          margin="dense"
          id="comment"
          label="Comment"
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          fullWidth
          multiline
          rows={2}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleAdd} variant="contained" color="primary">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};