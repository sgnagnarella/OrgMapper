
// src/ai/flows/map-csv-columns.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow that uses AI to map columns from a CSV file to predefined fields.
 *
 * It exports:
 * - `mapCsvColumns`: An async function to map CSV columns.
 * - `MapCsvColumnsInput`: The input type for the `mapCsvColumns` function.
 * - `MapCsvColumnsOutput`: The output type for the `mapCsvColumns` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MapCsvColumnsInputSchema = z.object({
  csvHeader: z.string().describe('The header row of the CSV file as a string, with column names separated by commas.'),
});

export type MapCsvColumnsInput = z.infer<typeof MapCsvColumnsInputSchema>;

const MapCsvColumnsOutputSchema = z.object({
  columnMapping: z.object({
    manager: z.string().describe('The column header from the CSV that corresponds to the manager field. Examples: "Manager User Name", "Reports To", "Supervisor". Should be an empty string if no suitable column is found.'),
    location: z.string().describe('The column header from the CSV that corresponds to the location field. Examples: "Location Site", "Office", "Work Location". Should be an empty string if no suitable column is found.'),
    teamProject: z.string().describe('The column header from the CSV that corresponds to the team or project field. Examples: "Team/Project", "Department", "Cost Center". Should be an empty string if no suitable column is found.'),
    employeeType: z.string().describe('The column header from the CSV that corresponds to the employee type field. Examples: "Person Type", "Employee Status", "Worker Type". Should be an empty string if no suitable column is found.'),
    level: z.string().describe('The column header from the CSV that corresponds to the level or grade field. Examples: "Job Level", "Grade", "Pay Level". Should be an empty string if no suitable column is found.'),
  }).describe('The mapping of CSV columns to target data fields. Each key should be a target field name, and its value should be the corresponding CSV header name, or an empty string if no mapping is found.'),
});

export type MapCsvColumnsOutput = z.infer<typeof MapCsvColumnsOutputSchema>;

export async function mapCsvColumns(input: MapCsvColumnsInput): Promise<MapCsvColumnsOutput> {
  return mapCsvColumnsFlow(input);
}

const mapCsvColumnsPrompt = ai.definePrompt({
  name: 'mapCsvColumnsPrompt',
  input: {schema: MapCsvColumnsInputSchema},
  output: {schema: MapCsvColumnsOutputSchema},
  prompt: `You are an expert in data mapping. Your task is to map CSV column headers to a predefined set of target fields.
Predefined Target Fields and common examples of CSV column names they might correspond to:
- Manager: Identifies the direct manager of the employee (e.g., 'Manager', 'Manager User Name', 'Reports To', 'Direct Supervisor', 'Manager ID').
- Location: Specifies the work location of the employee (e.g., 'Location', 'Site', 'Office Location', 'Work Site', 'Location Unified').
- Team/Project: The team, project, or department the employee is part of (e.g., 'Team', 'Project', 'Department', 'Cost Center', 'Org Unit').
- Employee Type: The type of employment (e.g., 'Employee Type', 'Person Type', 'Worker Type', 'Employment Status', 'FTE/Contractor').
- Level: The job level, grade, or seniority of the employee (e.g., 'Level', 'Job Level', 'Grade', 'Rank').

CSV Header Provided:
{{{csvHeader}}}

Instructions:
Carefully examine the provided CSV Header. For each of the predefined target fields listed above, identify the single best matching column header from the CSV.
Construct a JSON object for the 'columnMapping' field as defined in the output schema.
- The keys in this JSON object must be 'manager', 'location', 'teamProject', 'employeeType', and 'level'.
- The value for each key must be the exact CSV column header name you've chosen as the best match.
- If you cannot find a reasonably confident match for a target field in the CSV headers, or if no suitable column exists, use an empty string "" as the value for that field in the JSON output.
- Prioritize columns that seem most directly related to the target field's description. For example, for 'Manager', prefer 'Manager User Name' over 'Manager ID' if both are present, unless context suggests otherwise.

Output Example (ensure your output strictly follows this JSON structure):
{
  "columnMapping": {
    "manager": "Manager User Name",
    "location": "Location Site",
    "teamProject": "Cost Center",
    "employeeType": "Person Type",
    "level": "Job Level"
  }
}
If 'Job Level' was not in CSV headers, it might be:
{
  "columnMapping": {
    "manager": "Manager User Name",
    "location": "Location Site",
    "teamProject": "Cost Center",
    "employeeType": "Person Type",
    "level": ""
  }
}

Provide only the JSON object for 'columnMapping' based on the input CSV Header and the target fields.
`,
});

const mapCsvColumnsFlow = ai.defineFlow(
  {
    name: 'mapCsvColumnsFlow',
    inputSchema: MapCsvColumnsInputSchema,
    outputSchema: MapCsvColumnsOutputSchema,
  },
  async input => {
    const {output} = await mapCsvColumnsPrompt(input);
    // Ensure the output is not null and conforms to the schema,
    // especially if the AI might sometimes return a slightly different structure or be null.
    if (!output || !output.columnMapping) {
        // Fallback to an empty mapping if AI output is problematic
        return {
            columnMapping: {
                manager: '',
                location: '',
                teamProject: '',
                employeeType: '',
                level: '',
            }
        };
    }
    return output;
  }
);

