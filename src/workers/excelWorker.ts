/**
 * Excel Processing Web Worker
 * 
 * Handles heavy Excel export/import operations in a separate thread
 * to prevent UI blocking during large data processing.
 * 
 * Features:
 * - XLSX export/import in background thread
 * - Progress reporting
 * - Error handling
 * - Memory efficient processing
 * 
 * Created: 2025-11-06
 */

import * as XLSX from 'xlsx';

// Message types
export type WorkerMessage =
  | { type: 'export'; data: any; filename: string; sheetName: string }
  | { type: 'import'; file: File }
  | { type: 'cancel' };

export type WorkerResponse =
  | { type: 'progress'; progress: number; message: string }
  | { type: 'success'; result: any }
  | { type: 'error'; error: string };

// Handle incoming messages
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  try {
    switch (message.type) {
      case 'export':
        await handleExport(message.data, message.filename, message.sheetName);
        break;
      case 'import':
        await handleImport(message.file);
        break;
      case 'cancel':
        // Cancel current operation (if possible)
        self.postMessage({ type: 'error', error: 'Operation cancelled' } as WorkerResponse);
        break;
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as WorkerResponse);
  }
};

/**
 * Handle Excel export
 */
async function handleExport(data: any[][], filename: string, sheetName: string) {
  try {
    self.postMessage({
      type: 'progress',
      progress: 10,
      message: 'Creating worksheet...',
    } as WorkerResponse);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    self.postMessage({
      type: 'progress',
      progress: 50,
      message: 'Creating workbook...',
    } as WorkerResponse);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    self.postMessage({
      type: 'progress',
      progress: 80,
      message: 'Generating file...',
    } as WorkerResponse);

    // Write to buffer
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    self.postMessage({
      type: 'progress',
      progress: 100,
      message: 'Complete!',
    } as WorkerResponse);

    // Send result back
    self.postMessage({
      type: 'success',
      result: { buffer: wbout, filename },
    } as WorkerResponse);
  } catch (error) {
    throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle Excel import
 */
async function handleImport(file: File) {
  try {
    self.postMessage({
      type: 'progress',
      progress: 10,
      message: 'Reading file...',
    } as WorkerResponse);

    // Read file
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    self.postMessage({
      type: 'progress',
      progress: 40,
      message: 'Parsing Excel...',
    } as WorkerResponse);

    // Parse workbook
    const workbook = XLSX.read(data, { type: 'array' });

    self.postMessage({
      type: 'progress',
      progress: 70,
      message: 'Processing data...',
    } as WorkerResponse);

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    self.postMessage({
      type: 'progress',
      progress: 100,
      message: 'Complete!',
    } as WorkerResponse);

    // Send result back
    self.postMessage({
      type: 'success',
      result: { data: jsonData, sheetName },
    } as WorkerResponse);
  } catch (error) {
    throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
