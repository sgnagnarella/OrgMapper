export const TARGET_FIELDS = ['manager', 'location', 'teamProject', 'employeeType', 'level', 'username'] as const;
export type TargetField = typeof TARGET_FIELDS[number];

export type ColumnMappings = Record<TargetField, string | null>;

export interface EmployeeData {
  id: string; // Unique ID for each row, can be index
  manager: string;
  location: string;
  teamProject: string;
  employeeType: string;
  level: string;
  username: string;
  // Store original row data for potential future use or display
  originalRow: Record<string, string>;
}

export interface TreemapNode {
  name: string;
  value: number; // Size for the treemap cell
  children?: TreemapNode[];
  path: string; // e.g., "Manager A/Location X" to help with filtering
  type: 'manager' | 'location';
  // Additional properties if needed for styling or tooltips
  color?: string;
  itemStyle?: { color?: string };
  managerLocation?: string;
}

export interface ActiveFilters {
  level: string[];
  employeeType: string[];
  teamProject: string[];
  // For node click filtering
  clickedManager: string | null;
  clickedLocation: string | null;
}

export interface FilterOptions {
  levels: string[];
  employeeTypes: string[];
  teamProjects: string[];
}

// Type for AI mapping output (already defined in map-csv-columns.ts but good to have local ref if needed)
// export type AIMappedColumns = {
//   manager: string;
//   location: string;
//   teamProject: string;
//   employeeType: string;
//   level: string;
// };
