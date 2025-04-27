import { DailyData, Timestamp } from "../models/types";
import { formatDate } from "../utils/timeUtils";

const DB_NAME = "zeiterfassung-db";
const DB_VERSION = 1;
const STORE_NAME = "daily-data";

// Initialize the IndexedDB
export const initializeDb = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      reject("Error opening database");
    };
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "date" });
        objectStore.createIndex("date", "date", { unique: true });
      }
    };
  });
};

// Save daily data to IndexedDB
export const saveDailyData = async (dailyData: DailyData): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject("Error opening database");
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      
      const saveRequest = store.put(dailyData);
      saveRequest.onerror = () => reject("Error saving data");
      saveRequest.onsuccess = () => resolve();
    };
  });
};

// Load daily data from IndexedDB for a specific date
export const loadDailyData = async (date: Date): Promise<DailyData | null> => {
  const dateStr = formatDate(date);
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject("Error opening database");
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      
      const getRequest = store.get(dateStr);
      getRequest.onerror = () => reject("Error loading data");
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          resolve(getRequest.result as DailyData);
        } else {
          // If no data exists for this date, return a new empty daily data object
          resolve({
            date: dateStr,
            timestamps: []
          });
        }
      };
    };
  });
};

// Export daily data as JSON
export const exportDailyData = (dailyData: DailyData): string => {
  return JSON.stringify(dailyData, null, 2);
};

// Import daily data from JSON
export const importDailyData = (jsonString: string): DailyData | null => {
  try {
    const data = JSON.parse(jsonString);
    // Basic validation to ensure it's a DailyData object
    if (data && data.date && Array.isArray(data.timestamps)) {
      return data as DailyData;
    }
    return null;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return null;
  }
};