
// A very basic CSV parser.
// Limitations: Does not handle commas or newlines within quoted fields correctly.
// For production, consider a more robust library if complex CSVs are expected.

export function parseCSV(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText.trim().split(/\r\n|\n/); // Handle both CRLF and LF line endings
  if (lines.length === 0) return { headers: [], rows: [] };

  // Basic CSV header parsing: split by comma, trim whitespace, remove surrounding quotes.
  // Assign a placeholder if a header is empty to prevent issues with Select components.
  const parseHeader = (headerLine: string) =>
    headerLine.split(',').map((h, index) => {
      const trimmedHeader = h.trim().replace(/^"|"$/g, '');
      // If, after trimming and removing quotes, the header is an empty string,
      // replace it with a placeholder. Otherwise, use the trimmed header.
      return trimmedHeader === '' ? `(Unnamed Column ${index + 1})` : trimmedHeader;
    });

  const headers = parseHeader(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "") continue; // Skip empty lines

    // Basic CSV row parsing (same limitations as header)
    // This regex attempts to handle quoted fields with commas but is not fully robust.
    const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v =>
      v.trim().replace(/^"|"$/g, '')
    );

    if (values.length === headers.length) {
      const row = headers.reduce((obj, header, index) => {
        obj[header] = values[index] !== undefined ? values[index] : "";
        return obj;
      }, {} as Record<string, string>);
      rows.push(row);
    } else {
      // Log or handle rows with mismatched column counts if necessary
      console.warn(`Skipping row ${i+1} due to mismatched column count. Expected ${headers.length}, got ${values.length}. Line: ${lines[i]}`);
    }
  }
  return { headers, rows };
}
