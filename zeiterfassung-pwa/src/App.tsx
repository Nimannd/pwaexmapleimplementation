import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  Button,
  Container,
  CssBaseline,
  Fab,
  IconButton,
  Snackbar,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { TimestampList } from './components/TimestampList';
import { AddTimestamp } from './components/AddTimestamp';
import { TimeSummary } from './components/TimeSummary';
import { ConnectionStatus } from './components/ConnectionStatus';
import { DailyData, Timestamp, TimeSummary as TimeSummaryType } from './models/types';
import { calculateTimeSummaries, formatDate } from './utils/timeUtils';
import { initializeDb, loadDailyData, saveDailyData, exportDailyData, importDailyData } from './services/storageService';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  // State for the current date
  const [currentDate, setCurrentDate] = useState(new Date());
  const [formattedDate, setFormattedDate] = useState('');
  
  // State for timestamps and daily data
  const [dailyData, setDailyData] = useState<DailyData>({ date: '', timestamps: [] });
  const [summaries, setSummaries] = useState<TimeSummaryType[]>([]);
  
  // UI state
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });
  
  // File input ref for import functionality
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Initialize the database and load data for today when the app starts
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeDb();
        await loadDailyDataForDate(currentDate);
      } catch (error) {
        console.error("Error initializing database:", error);
        setSnackbar({
          open: true,
          message: "Error initializing database. Some features might not work properly.",
          severity: 'error'
        });
      }
    };

    initialize();
  }, []);

  // Update the formatted date whenever currentDate changes
  useEffect(() => {
    const date = formatDate(currentDate);
    setFormattedDate(date);
    
    // Format date for display in a more readable format
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const displayDate = currentDate.toLocaleDateString(undefined, options);
    document.title = `Zeiterfassung - ${displayDate}`;
  }, [currentDate]);

  // Calculate summaries whenever timestamps change
  useEffect(() => {
    const newSummaries = calculateTimeSummaries(dailyData.timestamps);
    setSummaries(newSummaries);
  }, [dailyData.timestamps]);

  // Load data for a specific date
  const loadDailyDataForDate = async (date: Date) => {
    try {
      const data = await loadDailyData(date);
      if (data) {
        setDailyData(data);
      } else {
        // If no data exists for this date, create an empty one
        setDailyData({ 
          date: formatDate(date), 
          timestamps: [] 
        });
      }
    } catch (error) {
      console.error("Error loading data for date:", error);
      setSnackbar({
        open: true,
        message: "Error loading data.",
        severity: 'error'
      });
    }
  };

  // Navigate to the previous day
  const handlePreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
    loadDailyDataForDate(newDate);
  };

  // Navigate to the next day
  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
    loadDailyDataForDate(newDate);
  };

  // Add a new timestamp
  const handleAddTimestamp = async (timestamp: Timestamp) => {
    const isFirst = dailyData.timestamps.length === 0;
    
    // If this is the first timestamp or marked as start, ensure it's a start timestamp
    if (isFirst) {
      timestamp.isStartTimestamp = true;
    }
    
    const updatedTimestamps = [...dailyData.timestamps, timestamp];
    const updatedDailyData = { ...dailyData, timestamps: updatedTimestamps };
    
    try {
      await saveDailyData(updatedDailyData);
      setDailyData(updatedDailyData);
      setSnackbar({
        open: true,
        message: "Timestamp added successfully.",
        severity: 'success'
      });
    } catch (error) {
      console.error("Error adding timestamp:", error);
      setSnackbar({
        open: true,
        message: "Error adding timestamp.",
        severity: 'error'
      });
    }
  };

  // Delete a timestamp
  const handleDeleteTimestamp = async (id: string) => {
    const updatedTimestamps = dailyData.timestamps.filter(t => t.id !== id);
    const updatedDailyData = { ...dailyData, timestamps: updatedTimestamps };
    
    try {
      await saveDailyData(updatedDailyData);
      setDailyData(updatedDailyData);
      setSnackbar({
        open: true,
        message: "Timestamp deleted.",
        severity: 'info'
      });
    } catch (error) {
      console.error("Error deleting timestamp:", error);
      setSnackbar({
        open: true,
        message: "Error deleting timestamp.",
        severity: 'error'
      });
    }
  };

  // Export data as JSON
  const handleExport = () => {
    if (dailyData.timestamps.length === 0) {
      setSnackbar({
        open: true,
        message: "No data to export.",
        severity: 'info'
      });
      return;
    }
    
    const jsonData = exportDailyData(dailyData);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zeiterfassung_${dailyData.date}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setSnackbar({
      open: true,
      message: "Data exported successfully.",
      severity: 'success'
    });
  };

  // Trigger file upload dialog
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Import data from JSON file
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const importedData = importDailyData(content);
      
      if (importedData && importedData.date === dailyData.date) {
        try {
          await saveDailyData(importedData);
          setDailyData(importedData);
          setSnackbar({
            open: true,
            message: "Data imported successfully.",
            severity: 'success'
          });
        } catch (error) {
          console.error("Error importing data:", error);
          setSnackbar({
            open: true,
            message: "Error importing data.",
            severity: 'error'
          });
        }
      } else {
        setSnackbar({
          open: true,
          message: "Invalid data or date doesn't match current day.",
          severity: 'error'
        });
      }
    };
    
    reader.readAsText(file);
    // Reset the input value so the same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };

  // Get all unique labels from the current day's timestamps
  const getExistingLabels = () => {
    return Array.from(
      new Set(dailyData.timestamps.map(t => t.label).filter(Boolean) as string[])
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="App" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Zeiterfassung
            </Typography>
            <IconButton 
              color="inherit" 
              aria-label="export data" 
              onClick={handleExport}
              title="Export data"
            >
              <FileDownloadIcon />
            </IconButton>
            <IconButton 
              color="inherit" 
              aria-label="import data" 
              onClick={handleImportClick}
              title="Import data"
            >
              <FileUploadIcon />
            </IconButton>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </Toolbar>
        </AppBar>

        <Container component="main" sx={{ mt: 2, mb: 2, flex: 1 }}>
          {/* Date navigation */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 2
            }}
          >
            <IconButton 
              color="primary" 
              aria-label="previous day" 
              onClick={handlePreviousDay}
            >
              <ArrowBackIcon />
            </IconButton>
            
            <Typography variant="h5" component="h1">
              {currentDate.toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Typography>
            
            <IconButton 
              color="primary" 
              aria-label="next day" 
              onClick={handleNextDay}
            >
              <ArrowForwardIcon />
            </IconButton>
          </Box>

          {/* Timestamp list */}
          <TimestampList 
            timestamps={dailyData.timestamps} 
            onDelete={handleDeleteTimestamp} 
          />

          {/* Time summary */}
          <TimeSummary summaries={summaries} />
        </Container>

        {/* Floating action button to add a new timestamp */}
        <Fab 
          color="primary" 
          aria-label="add timestamp" 
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setOpenAddDialog(true)}
        >
          <AddIcon />
        </Fab>

        {/* Add timestamp dialog */}
        <AddTimestamp
          open={openAddDialog}
          onClose={() => setOpenAddDialog(false)}
          onAdd={handleAddTimestamp}
          isFirst={dailyData.timestamps.length === 0}
          existingLabels={getExistingLabels()}
        />

        {/* Connection status notifications */}
        <ConnectionStatus />
        
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;
