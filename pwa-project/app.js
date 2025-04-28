document.addEventListener('DOMContentLoaded', () => {
    // Application state
    let currentDate = new Date();
    let usedLabels = new Set();
    
    // Initialize service worker for PWA functionality
    initializeServiceWorker();
    
    // Cache DOM element references
    const elements = {
        currentDate: document.getElementById('current-date'),
        timestampList: document.getElementById('timestamp-list'),
        summaryContent: document.getElementById('summary-content'),
        timestampForm: document.getElementById('timestamp-form'),
        inputs: {
            time: document.getElementById('timestamp-time'),
            label: document.getElementById('timestamp-label'),
            comment: document.getElementById('timestamp-comment'),
            isStartStamp: document.getElementById('is-start-stamp')
        },
        buttons: {
            add: document.getElementById('add-timestamp'),
            prev: document.getElementById('prev-day'),
            next: document.getElementById('next-day'),
            export: document.getElementById('export-data')
        },
        labelSuggestions: document.getElementById('label-suggestions')
    };
    
    // Initialize application
    setCurrentTime(elements.inputs.time);
    updateDateDisplay(elements.currentDate, currentDate);
    loadData(currentDate, elements, usedLabels);
    
    // Register event listeners
    registerEventListeners(elements, currentDate, usedLabels);
    
    /**
     * Initialize service worker for PWA functionality
     */
    function initializeServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }
    }

    // Set current time in the time input
    function setCurrentTime(inputElement) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        inputElement.value = `${hours}:${minutes}`;
    }

    // Update the date display
    function updateDateDisplay(dateElement, date) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = date.toLocaleDateString(undefined, options);
    }

    // Save data to localStorage
    function saveData(currentDate, elements, usedLabels) {
        // First sort timestamps in the UI
        sortAndDisplayTimestamps(elements.timestampList);
        
        const timestamps = [];
        elements.timestampList.querySelectorAll('.timestamp-item').forEach(item => {
            const timeElement = item.querySelector('.timestamp-time');
            const labelElement = item.querySelector('.timestamp-label');
            const commentElement = item.querySelector('.timestamp-comment');
            
            // Only add the timestamp if we have a valid time element
            if (timeElement) {
                timestamps.push({
                    time: timeElement.textContent,
                    label: labelElement ? labelElement.textContent.trim() : '',
                    comment: commentElement ? commentElement.textContent.trim() : '',
                    isStartStamp: item.classList.contains('start-stamp')
                });
            }
        });

        const data = { 
            timestamps: timestamps,
            date: currentDate.toISOString()
        };

        localStorage.setItem(currentDate.toISOString().split('T')[0], JSON.stringify(data));
        updateLabelSuggestions(elements.labelSuggestions, usedLabels);
        calculateSummary(elements.summaryContent, elements.timestampList);
    }

    // Load data from localStorage
    function loadData(currentDate, elements, usedLabels) {
        usedLabels.clear();
        const dateKey = currentDate.toISOString().split('T')[0];
        const data = JSON.parse(localStorage.getItem(dateKey));
        
        elements.timestampList.innerHTML = '';
        
        if (data && data.timestamps && data.timestamps.length > 0) {
            data.timestamps.forEach(ts => {
                createTimestampElement(
                    ts.time, 
                    ts.label || '', 
                    ts.comment || '', 
                    ts.isStartStamp || false,
                    elements.timestampList
                );
                
                if (ts.label) {
                    usedLabels.add(ts.label);
                }
            });
            
            // Sort timestamps after loading
            sortAndDisplayTimestamps(elements.timestampList);
        }
        
        updateLabelSuggestions(elements.labelSuggestions, usedLabels);
        calculateSummary(elements.summaryContent, elements.timestampList);
    }

    // Update label suggestions
    function updateLabelSuggestions(labelSuggestionsElement, usedLabels) {
        labelSuggestionsElement.innerHTML = '';
        usedLabels.forEach(label => {
            const option = document.createElement('option');
            option.value = label;
            labelSuggestionsElement.appendChild(option);
        });
    }

    // Create timestamp element
    function createTimestampElement(time, label, comment, isStartStamp, timestampList) {
        const listItem = document.createElement('li');
        listItem.className = 'timestamp-item';
        if (isStartStamp) {
            listItem.classList.add('start-stamp');
        }

        const timestampInfo = document.createElement('div');
        timestampInfo.className = 'timestamp-info';

        const timeSpan = document.createElement('span');
        timeSpan.className = 'timestamp-time';
        timeSpan.textContent = time;

        const labelSpan = document.createElement('span');
        labelSpan.className = 'timestamp-label';
        labelSpan.textContent = label;

        const commentSpan = document.createElement('span');
        commentSpan.className = 'timestamp-comment';
        commentSpan.textContent = comment;

        timestampInfo.appendChild(timeSpan);
        if (label) {
            timestampInfo.appendChild(document.createTextNode(' - '));
            timestampInfo.appendChild(labelSpan);
        }
        if (comment) {
            timestampInfo.appendChild(document.createTextNode(' ('));
            timestampInfo.appendChild(commentSpan);
            timestampInfo.appendChild(document.createTextNode(')'));
        }

        const timestampActions = document.createElement('div');
        timestampActions.className = 'timestamp-actions';

        // Add edit button
        const editButton = document.createElement('button');
        editButton.textContent = '✏️';
        editButton.title = 'Bearbeiten';
        editButton.addEventListener('click', () => {
            // Fill form fields with this timestamp's data for editing
            elements.inputs.time.value = time;
            elements.inputs.label.value = label;
            elements.inputs.comment.value = comment;
            elements.inputs.isStartStamp.checked = listItem.classList.contains('start-stamp');
            
            // Store original timestamp element for updating
            elements.timestampForm.dataset.editingId = listItem.dataset.id;
            
            // Change add button text to indicate editing
            elements.buttons.add.textContent = 'Zeitstempel speichern';
            
            // Add cancel button if not exists
            if (!document.getElementById('cancel-edit')) {
                const cancelButton = document.createElement('button');
                cancelButton.id = 'cancel-edit';
                cancelButton.textContent = 'Abbrechen';
                cancelButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    resetForm(elements);
                });
                elements.buttons.add.parentNode.insertBefore(cancelButton, elements.buttons.add.nextSibling);
            }
        });

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '🗑️';
        deleteButton.title = 'Löschen';
        deleteButton.addEventListener('click', () => {
            listItem.remove();
            saveData(currentDate, elements, usedLabels);
        });

        const toggleStartButton = document.createElement('button');
        toggleStartButton.textContent = isStartStamp ? '⭐' : '☆';
        toggleStartButton.title = 'Als Startstempel markieren/entfernen';
        toggleStartButton.addEventListener('click', () => {
            listItem.classList.toggle('start-stamp');
            toggleStartButton.textContent = listItem.classList.contains('start-stamp') ? '⭐' : '☆';
            saveData(currentDate, elements, usedLabels);
        });

        // Add unique identifier for this timestamp for edit tracking
        listItem.dataset.id = Date.now() + Math.random().toString(36).substr(2, 9);

        timestampActions.appendChild(editButton);
        timestampActions.appendChild(toggleStartButton);
        timestampActions.appendChild(deleteButton);

        listItem.appendChild(timestampInfo);
        listItem.appendChild(timestampActions);
        timestampList.appendChild(listItem);

        return listItem;
    }

    // Reset form to default state (for canceling edit or after adding)
    function resetForm(elements) {
        setCurrentTime(elements.inputs.time);
        elements.inputs.label.value = '';
        elements.inputs.comment.value = '';
        elements.inputs.isStartStamp.checked = false;
        
        // Reset edit mode indicators
        if (elements.timestampForm) {
            elements.timestampForm.dataset.editingId = '';
        }
        elements.buttons.add.textContent = 'Zeitstempel hinzufügen';
        
        // Remove cancel button if exists
        const cancelButton = document.getElementById('cancel-edit');
        if (cancelButton) {
            cancelButton.remove();
        }
    }

    // Parse time string to minutes since midnight
    function timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Format minutes to time string (HH:MM)
    function minutesToTimeString(totalMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    // Sort and display timestamps in chronological order
    function sortAndDisplayTimestamps(timestampList) {
        // Collect all timestamps
        const allTimestamps = [];
        timestampList.querySelectorAll('.timestamp-item').forEach(item => {
            const timeElement = item.querySelector('.timestamp-time');
            if (timeElement) {
                allTimestamps.push({
                    element: item,
                    time: timeElement.textContent,
                    minutes: timeToMinutes(timeElement.textContent)
                });
            }
        });

        // Sort timestamps by time
        allTimestamps.sort((a, b) => a.minutes - b.minutes);
        
        // Clear the list
        timestampList.innerHTML = '';
        
        // Re-add timestamps in sorted order
        allTimestamps.forEach(ts => {
            timestampList.appendChild(ts.element);
        });
    }

    // Calculate and display time summary
    function calculateSummary(summaryContent, timestampList) {
        console.log("Starting summary calculation...");
        summaryContent.innerHTML = '';
        const timestamps = [];
        
        // Collect all timestamps
        timestampList.querySelectorAll('.timestamp-item').forEach(item => {
            const timeElement = item.querySelector('.timestamp-time');
            const labelElement = item.querySelector('.timestamp-label');
            
            // Skip invalid timestamps
            if (!timeElement) return;
            
            // Make sure to properly handle empty labels
            const labelText = labelElement ? labelElement.textContent.trim() : '';
            
            timestamps.push({
                time: timeElement.textContent,
                label: labelText,
                isStartStamp: item.classList.contains('start-stamp'),
                minutes: timeToMinutes(timeElement.textContent)
            });
        });

        if (timestamps.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Keine Zeitstempel für heute.';
            summaryContent.appendChild(emptyMessage);
            return;
        }

        console.log(`Found ${timestamps.length} timestamps`);

        // Sort timestamps by time
        timestamps.sort((a, b) => a.minutes - b.minutes);
        console.log("Timestamps sorted:", timestamps);

        // Check if we have more than one timestamp (needed for time difference calculation)
        if (timestamps.length < 2) {
            const warningMessage = document.createElement('p');
            warningMessage.textContent = 'Mindestens zwei Zeitstempel werden benötigt, um eine Zusammenfassung zu erstellen.';
            summaryContent.appendChild(warningMessage);
            return;
        }

        // Calculate durations between timestamps
        let labelDurations = {};
        let totalDuration = 0;
        
        // Find all periods between timestamps
        for (let i = 0; i < timestamps.length - 1; i++) {
            const current = timestamps[i];
            const next = timestamps[i + 1];
            
            // Skip this entire period if the current timestamp is marked as start stamp
            // but it's not the very first timestamp (first timestamp is always considered)
            if (current.isStartStamp && i > 0) {
                console.log(`Skipping time period after start stamp at ${current.time}`);
                continue;
            }
            
            // Skip if the next timestamp is marked as start stamp
            if (next.isStartStamp) {
                console.log(`Skipping time period before start stamp at ${next.time}`);
                continue;
            }
            
            const duration = next.minutes - current.minutes;
            
            // Only count positive durations
            if (duration > 0) {
                // Attribute time to the NEXT timestamp's label (not the current one)
                const label = next.label || 'Ohne Bezeichnung';
                labelDurations[label] = (labelDurations[label] || 0) + duration;
                totalDuration += duration;
                console.log(`Added ${duration} minutes to ${label} (${current.time} to ${next.time}), now: ${labelDurations[label]}`);
            }
        }

        console.log("Label durations:", labelDurations);
        console.log("Total duration:", totalDuration);

        // Create summary cards for each label
        Object.entries(labelDurations).forEach(([label, minutes]) => {
            const summaryCard = document.createElement('div');
            summaryCard.className = 'summary-card';
            
            const labelElement = document.createElement('div');
            labelElement.className = 'summary-label';
            labelElement.textContent = label;
            
            const timeElement = document.createElement('div');
            timeElement.className = 'summary-time';
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            timeElement.textContent = `${hours}h ${mins}m`;
            
            summaryCard.appendChild(labelElement);
            summaryCard.appendChild(timeElement);
            summaryContent.appendChild(summaryCard);
        });

        // Add total time card
        if (totalDuration > 0) {
            const totalCard = document.createElement('div');
            totalCard.className = 'summary-card total-card';
            totalCard.style.gridColumn = '1 / -1'; // Span across all columns
            totalCard.style.backgroundColor = '#e7f4ff';
            
            const totalLabelElement = document.createElement('div');
            totalLabelElement.className = 'summary-label';
            totalLabelElement.textContent = 'Gesamt';
            
            const totalTimeElement = document.createElement('div');
            totalTimeElement.className = 'summary-time';
            const totalHours = Math.floor(totalDuration / 60);
            const totalMins = totalDuration % 60;
            totalTimeElement.textContent = `${totalHours}h ${totalMins}m`;
            
            totalCard.appendChild(totalLabelElement);
            totalCard.appendChild(totalTimeElement);
            summaryContent.appendChild(totalCard);
        }
    }

    // Register event listeners
    function registerEventListeners(elements, currentDate, usedLabels) {
        elements.buttons.prev.addEventListener('click', () => {
            saveData(currentDate, elements, usedLabels);
            currentDate.setDate(currentDate.getDate() - 1);
            updateDateDisplay(elements.currentDate, currentDate);
            loadData(currentDate, elements, usedLabels);
        });

        elements.buttons.next.addEventListener('click', () => {
            saveData(currentDate, elements, usedLabels);
            currentDate.setDate(currentDate.getDate() + 1);
            updateDateDisplay(elements.currentDate, currentDate);
            loadData(currentDate, elements, usedLabels);
        });

        elements.buttons.add.addEventListener('click', () => {
            const time = elements.inputs.time.value || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
            const label = elements.inputs.label.value.trim();
            const comment = elements.inputs.comment.value.trim();
            const isStartStamp = elements.inputs.isStartStamp.checked;
            
            // Check if we're in edit mode
            const editingId = elements.timestampForm?.dataset?.editingId;
            
            if (editingId) {
                // Find the timestamp element being edited
                const existingItem = Array.from(elements.timestampList.querySelectorAll('.timestamp-item'))
                    .find(item => item.dataset.id === editingId);
                    
                if (existingItem) {
                    // Update existing timestamp
                    existingItem.querySelector('.timestamp-time').textContent = time;
                    existingItem.querySelector('.timestamp-label').textContent = label;
                    existingItem.querySelector('.timestamp-comment').textContent = comment;
                    
                    // Update start stamp status
                    if (isStartStamp) {
                        existingItem.classList.add('start-stamp');
                        existingItem.querySelector('button[title="Als Startstempel markieren/entfernen"]').textContent = '⭐';
                    } else {
                        existingItem.classList.remove('start-stamp');
                        existingItem.querySelector('button[title="Als Startstempel markieren/entfernen"]').textContent = '☆';
                    }
                    
                    // Reset form to add mode
                    resetForm(elements);
                    
                    // Save the updated timestamp and recalculate summary
                    saveData(currentDate, elements, usedLabels);
                }
            } else {
                // Create a new timestamp element
                createTimestampElement(time, label, comment, isStartStamp, elements.timestampList);
                
                // Reset form fields but DON'T change the time field
                // to keep the time that was selected by the user
                elements.inputs.label.value = '';
                elements.inputs.comment.value = '';
                elements.inputs.isStartStamp.checked = false;
            }
            
            // Add label to suggestions if it doesn't exist
            if (label) {
                usedLabels.add(label);
            }
            
            // Save and update
            saveData(currentDate, elements, usedLabels);
        });

        elements.buttons.export.addEventListener('click', () => {
            const dateKey = currentDate.toISOString().split('T')[0];
            const data = JSON.parse(localStorage.getItem(dateKey)) || { timestamps: [], date: currentDate.toISOString() };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `zeiterfassung_${dateKey}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
        });

        document.getElementById('import-data').addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        
                        if (data && data.date && data.timestamps) {
                            currentDate = new Date(data.date);
                            updateDateDisplay(elements.currentDate, currentDate);
                            
                            // Clear current data
                            elements.timestampList.innerHTML = '';
                            usedLabels.clear();
                            
                            // Load imported data
                            data.timestamps.forEach(ts => {
                                createTimestampElement(
                                    ts.time, 
                                    ts.label || '', 
                                    ts.comment || '', 
                                    ts.isStartStamp || false,
                                    elements.timestampList
                                );
                                
                                if (ts.label) {
                                    usedLabels.add(ts.label);
                                }
                            });
                            
                            saveData(currentDate, elements, usedLabels);
                            
                            // Show success message
                            alert('Daten erfolgreich importiert.');
                        } else {
                            alert('Ungültiges Dateiformat. Die Datei muss Zeitstempel und ein Datum enthalten.');
                        }
                    } catch (error) {
                        console.error('Import error:', error);
                        alert('Fehler beim Importieren der Datei: ' + error.message);
                    }
                    
                    // Reset file input
                    event.target.value = null;
                };
                reader.readAsText(file);
            }
        });
    }
});
