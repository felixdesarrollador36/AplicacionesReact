import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ErrorRecord {
  id: string;
  error: string;
  reason: string;
  lesson: string;
  audioUri?: string;
  reminderEnabled: boolean;
  reminderTime?: string; // HH:MM
  reminderDays: number[]; // 0-6, Sunday=0
  createdAt: string;
}

const STORAGE_KEY = '@error_records';

export const saveErrorRecord = async (record: ErrorRecord): Promise<void> => {
  try {
    const existingRecords = await getErrorRecords();
    existingRecords.push(record);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existingRecords));
  } catch (error) {
    console.error('Error saving record:', error);
  }
};

export const getErrorRecords = async (): Promise<ErrorRecord[]> => {
  console.log('getErrorRecords called');
  try {
    const records = await AsyncStorage.getItem(STORAGE_KEY);
    console.log('AsyncStorage getItem result:', records ? 'data' : 'null');
    const parsed = records ? JSON.parse(records) : [];
    console.log('Parsed records:', parsed.length);
    return parsed;
  } catch (error) {
    console.error('Error getting records:', error);
    return [];
  }
};

export const updateErrorRecord = async (id: string, updatedRecord: Partial<ErrorRecord>): Promise<void> => {
  try {
    const records = await getErrorRecords();
    const index = records.findIndex(r => r.id === id);
    if (index !== -1) {
      records[index] = { ...records[index], ...updatedRecord };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }
  } catch (error) {
    console.error('Error updating record:', error);
  }
};

export const deleteErrorRecord = async (id: string): Promise<void> => {
  console.log('deleteErrorRecord called with id:', id);
  try {
    console.log('Getting current records');
    const records = await getErrorRecords();
    console.log('Current records:', records.length);
    const filteredRecords = records.filter(r => r.id !== id);
    console.log('Filtered records:', filteredRecords.length);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRecords));
    console.log('Records saved to AsyncStorage');
  } catch (error) {
    console.error('Error deleting record:', error);
  }
};