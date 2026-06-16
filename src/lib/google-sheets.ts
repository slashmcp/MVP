import { google } from 'googleapis';

// ========================================
// Google Sheets Configuration
// ========================================
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

let sheetsClient: ReturnType<typeof google.sheets> | null = null;

async function getAuth() {
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyFile) {
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: SCOPES,
  });
  return auth;
}

async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  const auth = await getAuth();
  if (!auth) return null;

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// Sheet tab names
const TABS = {
  candidates: 'Candidates',
  jobs: 'Jobs',
  clients: 'Clients',
  placements: 'Placements',
  outreach: 'Outreach',
} as const;

// ========================================
// Generic CRUD Operations
// ========================================
export async function getSheetData(tab: string): Promise<string[][] | null> {
  const client = await getSheetsClient();
  if (!client || !SHEET_ID) return null;

  try {
    const response = await client.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${tab}!A:Z`,
    });
    return response.data.values as string[][] || [];
  } catch (error) {
    console.error(`Error reading ${tab}:`, error);
    return null;
  }
}

export async function appendSheetRow(tab: string, values: string[]): Promise<boolean> {
  const client = await getSheetsClient();
  if (!client || !SHEET_ID) return false;

  try {
    await client.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${tab}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });
    return true;
  } catch (error) {
    console.error(`Error appending to ${tab}:`, error);
    return false;
  }
}

export async function updateSheetRow(
  tab: string,
  rowIndex: number,
  values: string[]
): Promise<boolean> {
  const client = await getSheetsClient();
  if (!client || !SHEET_ID) return false;

  try {
    await client.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${tab}!A${rowIndex}:Z${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });
    return true;
  } catch (error) {
    console.error(`Error updating ${tab} row ${rowIndex}:`, error);
    return false;
  }
}

export async function deleteSheetRow(tab: string, rowIndex: number): Promise<boolean> {
  const client = await getSheetsClient();
  if (!client || !SHEET_ID) return false;

  try {
    const spreadsheet = await client.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    });

    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === tab
    );

    if (!sheet?.properties?.sheetId) return false;

    await client.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex - 1, // 0-indexed
                endIndex: rowIndex,
              },
            },
          },
        ],
      },
    });
    return true;
  } catch (error) {
    console.error(`Error deleting ${tab} row ${rowIndex}:`, error);
    return false;
  }
}

// ========================================
// Helper: Check if Google Sheets is configured
// ========================================
export function isGoogleSheetsConfigured(): boolean {
  return !!(process.env.GOOGLE_SERVICE_ACCOUNT_KEY && process.env.GOOGLE_SHEET_ID);
}

// ========================================
// Sheet-specific parsers
// ========================================
export function parseSheetRows<T>(
  rows: string[][],
  parser: (row: string[], index: number) => T
): T[] {
  if (rows.length <= 1) return []; // Skip header row
  return rows.slice(1).map((row, i) => parser(row, i + 2)); // +2: 1 for 0-index, 1 for header
}

export { TABS };
