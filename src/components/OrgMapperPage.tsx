
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileUploadButton } from '@/components/FileUploadButton';
import { ColumnSelector } from '@/components/ColumnSelector';
import { FilterControls } from '@/components/FilterControls';
import { OrgTreemapChart } from '@/components/OrgTreemapChart';
import { parseCSV } from '@/lib/csvParser';
import { mapCsvColumns, MapCsvColumnsInput, MapCsvColumnsOutput } from '@/ai/flows/map-csv-columns';
import { TARGET_FIELDS, TargetField, ColumnMappings, EmployeeData, TreemapNode, ActiveFilters, FilterOptions } from '@/types';
import { Loader2, AlertTriangle, CheckCircle, Settings2, Filter as FilterIcon, BarChart2, UploadCloud } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const initialColumnMappings = TARGET_FIELDS.reduce((acc, field) => ({ ...acc, [field]: null }), {} as ColumnMappings);
const initialActiveFilters: ActiveFilters = {
  level: null,
  employeeType: null,
  teamProject: null,
  clickedManager: null,
  clickedLocation: null,
};

export default function OrgMapperPage() {
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  
  const [columnMappings, setColumnMappings] = useState<ColumnMappings>(initialColumnMappings);
  
  const [processedEmployees, setProcessedEmployees] = useState<EmployeeData[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeData[]>([]);

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ levels: [], employeeTypes: [], teamProjects: [] });
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(initialActiveFilters);
  
  const [treemapData, setTreemapData] = useState<TreemapNode[]>([]);

  const [isParsing, setIsParsing] = useState(false);
  const [isMappingAi, setIsMappingAi] = useState(false);
  const [isProcessingData, setIsProcessingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setIsParsing(true);
    setCsvHeaders([]);
    setCsvRows([]);
    setColumnMappings(initialColumnMappings);
    setProcessedEmployees([]);
    setFilteredEmployees([]);
    setTreemapData([]);
    setActiveFilters(initialActiveFilters);

    try {
      const text = await selectedFile.text();
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0 || rows.length === 0) {
        throw new Error("CSV is empty or invalid.");
      }
      setCsvHeaders(headers);
      setCsvRows(rows);
      toast({ title: "CSV Uploaded", description: `${selectedFile.name} processed successfully. ${rows.length} rows found.` });
    } catch (e: any) {
      setError(`Error parsing CSV: ${e.message}`);
      toast({ variant: "destructive", title: "CSV Parsing Error", description: e.message });
    } finally {
      setIsParsing(false);
    }
  }, [toast]);

  const handleAiMapColumns = useCallback(async () => {
    if (csvHeaders.length === 0) return;
    setIsMappingAi(true);
    setError(null);
    try {
      const input: MapCsvColumnsInput = { csvHeader: csvHeaders.join(',') };
      const result = await mapCsvColumns(input);
      
      const newMappings = { ...initialColumnMappings };
      let mappedCount = 0;
      (Object.keys(result.columnMapping) as Array<keyof typeof result.columnMapping>).forEach(key => {
        const targetKey = key as TargetField; // Ensure key is a TargetField
        const csvHeaderFound = result.columnMapping[key];
        if (csvHeaders.includes(csvHeaderFound)) {
          newMappings[targetKey] = csvHeaderFound;
          mappedCount++;
        } else {
          // AI suggested a column not in CSV headers, or empty string
          newMappings[targetKey] = null;
        }
      });
      setColumnMappings(newMappings);
      toast({ title: "AI Column Mapping", description: `AI suggested mappings for ${mappedCount} fields.` });
    } catch (e: any) {
      setError(`AI mapping error: ${e.message}`);
      toast({ variant: "destructive", title: "AI Mapping Error", description: e.message });
      setColumnMappings(initialColumnMappings); // Reset to manual if AI fails
    } finally {
      setIsMappingAi(false);
    }
  }, [csvHeaders, toast]);

  useEffect(() => {
    if (csvHeaders.length > 0 && !file?.name.endsWith("_mapped.csv")) { // Avoid re-running AI if it's a re-upload of a "mapped" file.
        handleAiMapColumns();
    }
  }, [csvHeaders, handleAiMapColumns, file]);

  const handleMappingChange = useCallback((field: TargetField, csvColumn: string | null) => {
    setColumnMappings(prev => ({ ...prev, [field]: csvColumn }));
  }, []);
  
  const applyMappingsAndProcessData = useCallback(() => {
    setError(null);
    setIsProcessingData(true);
    try {
      const mappedEmployees = csvRows.map((row, index) => {
        const employee: Partial<EmployeeData> & { originalRow: Record<string, string> } = { id: String(index), originalRow: row };
        TARGET_FIELDS.forEach(field => {
          const mappedHeader = columnMappings[field];
          employee[field] = mappedHeader ? row[mappedHeader] || '' : '';
        });
        return employee as EmployeeData;
      });

      setProcessedEmployees(mappedEmployees);

      // Derive filter options
      const levels = [...new Set(mappedEmployees.map(e => e.level).filter(Boolean))].sort();
      const employeeTypes = [...new Set(mappedEmployees.map(e => e.employeeType).filter(Boolean))].sort();
      const teamProjects = [...new Set(mappedEmployees.map(e => e.teamProject).filter(Boolean))].sort();
      setFilterOptions({ levels, employeeTypes, teamProjects });
      
      toast({ title: "Mappings Applied", description: `${mappedEmployees.length} records processed.` });
    } catch (e: any) {
      setError(`Error processing data with mappings: ${e.message}`);
      toast({ variant: "destructive", title: "Processing Error", description: e.message });
    } finally {
      setIsProcessingData(false);
    }
  }, [csvRows, columnMappings, toast]);

  const isMappingComplete = useMemo(() => {
    return TARGET_FIELDS.every(field => columnMappings[field] !== null);
  }, [columnMappings]);

  // Filter employees based on activeFilters
  useEffect(() => {
    let newFilteredEmployees = processedEmployees;

    if (activeFilters.clickedManager) {
      newFilteredEmployees = newFilteredEmployees.filter(e => e.manager === activeFilters.clickedManager);
      if (activeFilters.clickedLocation) {
        newFilteredEmployees = newFilteredEmployees.filter(e => e.location === activeFilters.clickedLocation);
      }
    }
    
    if (activeFilters.level) newFilteredEmployees = newFilteredEmployees.filter(e => e.level === activeFilters.level);
    if (activeFilters.employeeType) newFilteredEmployees = newFilteredEmployees.filter(e => e.employeeType === activeFilters.employeeType);
    if (activeFilters.teamProject) newFilteredEmployees = newFilteredEmployees.filter(e => e.teamProject === activeFilters.teamProject);
    
    setFilteredEmployees(newFilteredEmployees);
  }, [processedEmployees, activeFilters]);

  // Generate treemap data from filteredEmployees
  useEffect(() => {
    if (filteredEmployees.length === 0 && processedEmployees.length > 0) { // If filters result in no data, show empty chart
        setTreemapData([]);
        return;
    }
    if (filteredEmployees.length === 0) return;


    const managersMap = new Map<string, Map<string, number>>(); 

    filteredEmployees.forEach(emp => {
      if (!emp.manager || !emp.location) return;

      const managerLocations = managersMap.get(emp.manager) || new Map<string, number>();
      const currentLocationCount = managerLocations.get(emp.location) || 0;
      managerLocations.set(emp.location, currentLocationCount + 1);
      managersMap.set(emp.manager, managerLocations);
    });

    const newTreemapData: TreemapNode[] = [];
    managersMap.forEach((locations, managerName) => {
      const locationChildren: TreemapNode[] = [];
      let managerTotalEmployees = 0;
      locations.forEach((count, locationName) => {
        locationChildren.push({
          name: locationName,
          value: count,
          type: 'location',
          path: `${managerName}/${locationName}`,
        });
        managerTotalEmployees += count;
      });
      if (locationChildren.length > 0) { // Only add manager if they have locations with employees after filtering
        newTreemapData.push({
          name: managerName,
          children: locationChildren,
          type: 'manager',
          path: managerName,
          value: managerTotalEmployees 
        });
      }
    });
    setTreemapData(newTreemapData);
  }, [filteredEmployees, processedEmployees]); // Add processedEmployees to re-evaluate when it changes (e.g. new CSV)
  
  const handleFilterChange = useCallback((filterName: keyof Pick<ActiveFilters, 'level' | 'employeeType' | 'teamProject'>, value: string | null) => {
    setActiveFilters(prev => ({ 
        ...prev, 
        [filterName]: value,
        // Reset node click filters if regular filters are changed
        clickedManager: null, 
        clickedLocation: null,
    }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setActiveFilters(initialActiveFilters);
    toast({ title: "Filters Reset", description: "Displaying all data." });
  }, [toast]);

  const handleNodeClick = useCallback((node: TreemapNode) => {
    if (node.type === 'manager') {
      setActiveFilters(prev => ({
        ...prev, // Keep existing dropdown filters
        level: prev.level,
        employeeType: prev.employeeType,
        teamProject: prev.teamProject,
        clickedManager: node.name,
        clickedLocation: null,
      }));
      toast({ title: "Filtered by Manager", description: `Showing data for ${node.name}.` });
    } else if (node.type === 'location') {
      const [managerName] = node.path.split('/');
      setActiveFilters(prev => ({
        ...prev, // Keep existing dropdown filters
        level: prev.level,
        employeeType: prev.employeeType,
        teamProject: prev.teamProject,
        clickedManager: managerName,
        clickedLocation: node.name,
      }));
      toast({ title: "Filtered by Location", description: `Showing data for ${node.name} under ${managerName}.` });
    }
  }, [toast]);

  const sections = [
    { 
      title: "1. Upload CSV", 
      icon: <UploadCloud className="h-5 w-5" />,
      content: (
        <FileUploadButton onFileSelect={handleFileSelect} isLoading={isParsing} />
      ),
      show: true,
    },
    {
      title: "2. Map Columns",
      icon: <Settings2 className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          {TARGET_FIELDS.map(field => (
            <ColumnSelector
              key={field}
              fieldId={`map-${field}`}
              label={field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} // Camel case to Title Case
              options={csvHeaders}
              selectedValue={columnMappings[field]}
              onChange={(value) => handleMappingChange(field, value)}
              disabled={isMappingAi || csvHeaders.length === 0}
            />
          ))}
          <Button onClick={applyMappingsAndProcessData} disabled={isProcessingData || !isMappingComplete || csvRows.length === 0} className="w-full">
            {isProcessingData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Apply Mappings & Process Data
          </Button>
          {!isMappingComplete && csvHeaders.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">Map all fields to proceed.</p>
          )}
        </div>
      ),
      show: csvHeaders.length > 0,
    },
    {
      title: "3. Filter Data",
      icon: <FilterIcon className="h-5 w-5" />,
      content: (
        <FilterControls 
          options={filterOptions} 
          activeFilters={activeFilters} 
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          disabled={processedEmployees.length === 0}
        />
      ),
      show: processedEmployees.length > 0,
    }
  ];


  return (
    <div className="container mx-auto p-4 font-body">
      <header className="mb-6">
        <h1 className="text-4xl font-headline font-bold text-primary">OrgMapper</h1>
        <p className="text-muted-foreground">Visualize your organization's structure from a CSV file.</p>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Controls Panel */}
        <div className="lg:w-1/3 space-y-6">
          {sections.map(section => section.show && (
            <Card key={section.title} className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-headline">
                  {section.icon}
                  <span className="ml-2">{section.title}</span>
                  {section.title === "2. Map Columns" && isMappingAi && <Loader2 className="ml-auto h-5 w-5 animate-spin text-primary" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {section.content}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Treemap Panel */}
        <div className="lg:w-2/3">
          <Card className="shadow-md h-[calc(100vh-12rem)] min-h-[400px] lg:h-full"> {/* Adjust height as needed */}
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-headline">
                <BarChart2 className="h-5 w-5 text-primary" />
                <span className="ml-2">Organization Treemap</span>
              </CardTitle>
              <CardDescription>
                {activeFilters.clickedManager 
                  ? `Displaying: ${activeFilters.clickedManager}${activeFilters.clickedLocation ? ` > ${activeFilters.clickedLocation}` : ''}`
                  : "Overview of managers and their locations by employee count."}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100%-8rem)]"> {/* Adjust based on CardHeader height */}
              {(isParsing || isProcessingData) && !treemapData.length ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Loading data...</p>
                  </div>
              ) : processedEmployees.length > 0 ? (
                <OrgTreemapChart data={treemapData} onNodeClick={handleNodeClick} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <BarChart2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="text-lg text-muted-foreground">
                    {file ? "Apply column mappings to visualize data." : "Upload a CSV file to get started."}
                  </p>
                  {!file && <p className="text-sm text-muted-foreground">Map columns, apply filters, and explore your org structure.</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

