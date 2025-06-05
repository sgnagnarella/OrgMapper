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
  csvHeader: z.string().describe('The header row of the CSV file as a string.'),
});

export type MapCsvColumnsInput = z.infer<typeof MapCsvColumnsInputSchema>;

const MapCsvColumnsOutputSchema = z.object({
  columnMapping: z.object({
    manager: z.string().describe('The column header that corresponds to the manager field.'),
    location: z.string().describe('The column header that corresponds to the location field.'),
    teamProject: z.string().describe('The column header that corresponds to the team or project field.'),
    employeeType: z.string().describe('The column header that corresponds to the employee type field.'),
    level: z.string().describe('The column header that corresponds to the level field.'),
  }).describe('The mapping of CSV columns to data fields.'),
});

export type MapCsvColumnsOutput = z.infer<typeof MapCsvColumnsOutputSchema>;

export async function mapCsvColumns(input: MapCsvColumnsInput): Promise<MapCsvColumnsOutput> {
  return mapCsvColumnsFlow(input);
}

const mapCsvColumnsPrompt = ai.definePrompt({
  name: 'mapCsvColumnsPrompt',
  input: {schema: MapCsvColumnsInputSchema},
  output: {schema: MapCsvColumnsOutputSchema},
  prompt: `Given the following CSV header, map the columns to the following fields: Manager, Location, Team/Project, Employee Type, and Level.\n\nCSV Header: {{{csvHeader}}}\n\nOutput a JSON object with the column mapping. If a column cannot be mapped, leave as an empty string.
\nEnsure that the columnMapping field contains valid JSON object.`,  
});

const mapCsvColumnsFlow = ai.defineFlow(
  {
    name: 'mapCsvColumnsFlow',
    inputSchema: MapCsvColumnsInputSchema,
    outputSchema: MapCsvColumnsOutputSchema,
  },
  async input => {
    const {output} = await mapCsvColumnsPrompt(input);
    return output!;
  }
);
