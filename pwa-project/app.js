document.addEventListener('DOMContentLoaded', () => {
    const currentDateElement = document.getElementById('current-date');
    const timestampList = document.getElementById('timestamp-list');
    const summaryContent = document.getElementById('summary-content');

    let currentDate = new Date();

    function updateDateDisplay() {
        currentDateElement.textContent = currentDate.toLocaleDateString();
    }

    function saveData() {
        const data = { timestamps: [] };
        timestampList.querySelectorAll('li').forEach(item => {
            data.timestamps.push(item.textContent);
        });
        localStorage.setItem(currentDate.toISOString().split('T')[0], JSON.stringify(data));
    }

    function loadData() {
        const data = JSON.parse(localStorage.getItem(currentDate.toISOString().split('T')[0]));
        timestampList.innerHTML = '';
        if (data && data.timestamps) {
            data.timestamps.forEach(ts => {
                const listItem = document.createElement('li');
                listItem.textContent = ts;
                timestampList.appendChild(listItem);
            });
        }
    }

    document.getElementById('prev-day').addEventListener('click', () => {
        saveData();
        currentDate.setDate(currentDate.getDate() - 1);
        updateDateDisplay();
        loadData();
    });

    document.getElementById('next-day').addEventListener('click', () => {
        saveData();
        currentDate.setDate(currentDate.getDate() + 1);
        updateDateDisplay();
        loadData();
    });

    document.getElementById('add-timestamp').addEventListener('click', () => {
        const timestamp = new Date().toLocaleTimeString();
        const listItem = document.createElement('li');
        listItem.textContent = timestamp;
        timestampList.appendChild(listItem);
        saveData();
    });

    document.getElementById('export-data').addEventListener('click', () => {
        const data = { date: currentDate.toISOString(), timestamps: [] };
        timestampList.querySelectorAll('li').forEach(item => {
            data.timestamps.push(item.textContent);
        });
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentDate.toISOString().split('T')[0]}.json`;
        a.click();
    });

    document.getElementById('import-data').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const data = JSON.parse(reader.result);
                currentDate = new Date(data.date);
                updateDateDisplay();
                timestampList.innerHTML = '';
                data.timestamps.forEach(ts => {
                    const listItem = document.createElement('li');
                    listItem.textContent = ts;
                    timestampList.appendChild(listItem);
                });
            };
            reader.readAsText(file);
        }
    });

    updateDateDisplay();
    loadData();
});
