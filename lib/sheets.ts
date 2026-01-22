import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

export interface Athlete {
  email: string;
  name: string;
  gender?: 'male' | 'female';
  weight?: number;
  height?: number;
  competitionTier?: 'open' | 'quarterfinals' | 'semifinals' | 'games';
  createdAt?: string;
  updatedAt?: string;
}

// Get athlete by email
export async function getAthlete(email: string): Promise<Athlete | null> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'athletes!A:H',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return null;

    const headers = rows[0];
    const athleteRow = rows.find((row, i) => i > 0 && row[0]?.trim().toLowerCase() === normalizedEmail);
    
    if (!athleteRow) return null;

    return {
      email: athleteRow[0],
      name: athleteRow[1],
      gender: athleteRow[2] as 'male' | 'female',
      weight: athleteRow[3] ? parseFloat(athleteRow[3]) : undefined,
      height: athleteRow[4] ? parseFloat(athleteRow[4]) : undefined,
      competitionTier: athleteRow[5] as Athlete['competitionTier'],
      createdAt: athleteRow[6],
      updatedAt: athleteRow[7],
    };
  } catch (error) {
    console.error('Error fetching athlete:', error);
    return null;
  }
}

// Create or update athlete
export async function upsertAthlete(athlete: Athlete): Promise<boolean> {
  try {
    const normalizedEmail = athlete.email.trim().toLowerCase();
    const existing = await getAthlete(normalizedEmail);
    const now = new Date().toISOString();
    
    if (existing) {
      // Update existing
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'athletes!A:A',
      });
      
      const rows = response.data.values || [];
      const rowIndex = rows.findIndex((row, i) => i > 0 && row[0]?.trim().toLowerCase() === normalizedEmail);
      
      if (rowIndex > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `athletes!A${rowIndex + 1}:H${rowIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[
              normalizedEmail,
              athlete.name,
              athlete.gender || '',
              athlete.weight || '',
              athlete.height || '',
              athlete.competitionTier || '',
              existing.createdAt || now,
              now,
            ]],
          },
        });
      }
    } else {
      // Create new
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'athletes!A:H',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            normalizedEmail,
            athlete.name,
            athlete.gender || '',
            athlete.weight || '',
            athlete.height || '',
            athlete.competitionTier || '',
            now,
            now,
          ]],
        },
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error upserting athlete:', error);
    return false;
  }
}

// Generic function to get data from any tab
export async function getSheetData(tabName: string, email: string): Promise<Record<string, any> | null> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${tabName}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return null;

    const headers = rows[0];
    const dataRow = rows.find((row, i) => i > 0 && row[0]?.trim().toLowerCase() === normalizedEmail);
    
    if (!dataRow) return null;

    const result: Record<string, any> = {};
    headers.forEach((header: string, index: number) => {
      result[header] = dataRow[index] || null;
    });

    return result;
  } catch (error) {
    console.error(`Error fetching ${tabName} data:`, error);
    return null;
  }
}

// Generic function to save data to any tab
export async function saveSheetData(
  tabName: string, 
  email: string, 
  data: Record<string, any>
): Promise<boolean> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    
    // Get existing data to find row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${tabName}!A:Z`,
    });

    const rows = response.data.values || [];
    const headers = rows[0] || ['email', ...Object.keys(data)];
    
    // Build row data
    const rowData = headers.map((header: string) => {
      if (header === 'email') return normalizedEmail;
      if (header === 'updatedAt') return new Date().toISOString();
      return data[header] ?? '';
    });

    const existingRowIndex = rows.findIndex((row, i) => i > 0 && row[0]?.trim().toLowerCase() === normalizedEmail);

    if (existingRowIndex > 0) {
      // Update existing row
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${tabName}!A${existingRowIndex + 1}:${String.fromCharCode(65 + headers.length - 1)}${existingRowIndex + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [rowData] },
      });
    } else {
      // Append new row
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${tabName}!A:Z`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [rowData] },
      });
    }

    return true;
  } catch (error) {
    console.error(`Error saving ${tabName} data:`, error);
    return false;
  }
}

// Ensure sheet has headers
export async function ensureSheetHeaders(tabName: string, headers: string[]): Promise<void> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${tabName}!1:1`,
    });

    if (!response.data.values || response.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${tabName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [headers] },
      });
    }
  } catch (error) {
    console.error(`Error ensuring headers for ${tabName}:`, error);
  }
}
