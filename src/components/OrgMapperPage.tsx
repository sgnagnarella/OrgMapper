"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileUploadButton } from '@/components/FileUploadButton';
import { ColumnSelector } from '@/components/ColumnSelector';
import { FilterControls } from '@/components/FilterControls';
import { OrgTreemapChartEcharts, OrgTreemapChartEchartsHandle } from '@/components/OrgTreemapChartEcharts';
import { parseCSV } from '@/lib/csvParser';
import { mapCsvColumns, MapCsvColumnsInput, MapCsvColumnsOutput } from '@/ai/flows/map-csv-columns';
import { TARGET_FIELDS, TargetField, ColumnMappings, EmployeeData, TreemapNode, ActiveFilters, FilterOptions } from '@/types';
import { Loader2, AlertTriangle, CheckCircle, Settings2, Filter as FilterIcon, BarChart2, UploadCloud, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const initialColumnMappings = TARGET_FIELDS.reduce((acc, field) => ({ ...acc, [field]: null }), {} as ColumnMappings);
const initialActiveFilters: ActiveFilters = {
  level: [],
  employeeType: [],
  teamProject: [],
  clickedManager: null,
  clickedLocation: null,
  differentCampusOnly: false,
  showEmployeeCount: false,
};

const createUniqueSortedOptions = (values: (string | undefined | null)[]): string[] => {
  return [...new Set(values.map(v => v?.trim() || '').filter(v => v !== ''))].sort();
};

export default function OrgMapperPage() {
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
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

  const treemapRef = React.useRef<OrgTreemapChartEchartsHandle>(null);

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
        const targetKey = key as TargetField; 
        const csvHeaderFound = result.columnMapping[key];
        if (csvHeaderFound && csvHeaders.includes(csvHeaderFound)) {
          newMappings[targetKey] = csvHeaderFound;
          mappedCount++;
        } else {
          newMappings[targetKey] = null;
        }
      });
      setColumnMappings(newMappings);
      console.log("AI Mapped Column Mappings:", newMappings);
      toast({ title: "AI Column Mapping", description: `AI suggested mappings for ${mappedCount} fields.` });
    } catch (e: any) {
      setError(`AI mapping error: ${e.message}`);
      toast({ variant: "destructive", title: "AI Mapping Error", description: e.message });
      setColumnMappings(initialColumnMappings); 
    } finally {
      setIsMappingAi(false);
    }
  }, [csvHeaders, toast]);

  useEffect(() => {
    if (csvHeaders.length > 0 && !file?.name.endsWith("_mapped.csv")) { 
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
          const mappedHeader = columnMappings[field as TargetField];
          // Only set the field if mapped, or if not teamProject (which is optional)
          if (mappedHeader || field !== 'teamProject') {
            employee[field] = mappedHeader ? row[mappedHeader] || '' : '';
          }
        });
        return employee as EmployeeData;
      });

      setProcessedEmployees(mappedEmployees);
      console.log("Processed Employees:", mappedEmployees);

      const levels = createUniqueSortedOptions(mappedEmployees.map(e => e.level));
      const employeeTypes = createUniqueSortedOptions(mappedEmployees.map(e => e.employeeType));
      const teamProjects = createUniqueSortedOptions(mappedEmployees.map(e => e.teamProject));
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

  useEffect(() => {
    console.log("Filtering employees. Active filters:", activeFilters);
    let newFilteredEmployees = processedEmployees;

    if (activeFilters.clickedManager) {
      newFilteredEmployees = newFilteredEmployees.filter(e => e.manager === activeFilters.clickedManager);
      if (activeFilters.clickedLocation) {
        newFilteredEmployees = newFilteredEmployees.filter(e => e.location === activeFilters.clickedLocation);
      }
    }
    // Multi-select filter logic
    if (activeFilters.level.length > 0) newFilteredEmployees = newFilteredEmployees.filter(e => activeFilters.level.includes(e.level));
    if (activeFilters.employeeType.length > 0) newFilteredEmployees = newFilteredEmployees.filter(e => activeFilters.employeeType.includes(e.employeeType));
    if (activeFilters.teamProject.length > 0 && columnMappings.teamProject) newFilteredEmployees = newFilteredEmployees.filter(e => activeFilters.teamProject.includes(e.teamProject));

    // Employees campus ≠ Manager campus filter
    if (activeFilters.differentCampusOnly) {
      const usernameCol = columnMappings['username'];
      const locationCol = columnMappings['location'];
      if (usernameCol && locationCol) {
        newFilteredEmployees = newFilteredEmployees.filter(emp => {
          const managerRow = processedEmployees.find(e => e.originalRow[usernameCol] === emp.manager);
          if (!managerRow) return true; // If no manager row, keep
          const managerLoc = managerRow.originalRow[locationCol];
          return emp.location !== managerLoc;
        });
      }
    }

    console.log("Filtered Employees:", newFilteredEmployees);
    setFilteredEmployees(newFilteredEmployees);
  }, [processedEmployees, activeFilters, columnMappings]);

  useEffect(() => {
    if (filteredEmployees.length === 0 && processedEmployees.length > 0) { 
        setTreemapData([]);
        return;
    }
    if (filteredEmployees.length === 0) return;

    const managersMap = new Map<string, Map<string, number>>(); 

    filteredEmployees.forEach(emp => {
      console.log(`Employee: ${emp.id}, Manager: ${emp.manager}`);
      const managerName = emp.manager?.trim();
      // If location is empty or whitespace, use a placeholder. Manager must exist.
      const locationName = emp.location?.trim() || '(Unknown Location)'; 

      if (!managerName) { // Manager is absolutely essential for the treemap structure
        // Optionally log if employees are skipped due to missing manager
        // console.warn(`Skipping employee for treemap due to missing manager:`, emp.originalRow?.['User Name'] || emp.id);
        return;
      }

      const managerLocations = managersMap.get(managerName) || new Map<string, number>();
      const currentLocationCount = managerLocations.get(locationName) || 0;
      managerLocations.set(locationName, currentLocationCount + 1);
      managersMap.set(managerName, managerLocations);
    });
    console.log('Managers Map:', managersMap);

    // Color palette for managers (extend as needed)
    const managerColors = [
      '#6699CC', // blue
      '#E67300', // orange
      '#8BC34A', // green
      '#FFB300', // yellow
      '#E57373', // red
      '#BA68C8', // purple
      '#4DD0E1', // teal
      '#FFD54F', // gold
      '#A1887F', // brown
      '#90A4AE', // gray
    ];
    // Helper to generate HSL shade from hex
    function hexToHsl(hex: string, lightness: number) {
      let r = 0, g = 0, b = 0;
      if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
      }
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      h = Math.round(h * 360);
      s = Math.round(s * 100);
      return `hsl(${h}, ${s}%, ${lightness}%)`;
    }

    const newTreemapData: TreemapNode[] = [];
    let managerIndex = 0;
    managersMap.forEach((locations, managerName) => {
      const baseColor = managerColors[managerIndex % managerColors.length];
      const locationChildren: TreemapNode[] = [];
      let managerTotalEmployees = 0;
      let locIndex = 0;
      const totalLocs = locations.size;
      locations.forEach((count, locName) => {
        // Generate a shade for each location
        const lightness = 60 + Math.round((locIndex / Math.max(1, totalLocs - 1)) * 25); // 60% to 85%
        locationChildren.push({
          name: locName,
          value: count,
          type: 'location',
          path: `${managerName}/${locName}`,
          itemStyle: { color: hexToHsl(baseColor, lightness) },
        });
        managerTotalEmployees += count;
        locIndex++;
      });
      // Only add manager if they have location children
      if (locationChildren.length > 0) {
        // Find the manager's own location using the mapped username and location columns
        let managerLocation = '';
        const usernameCol = columnMappings['username'];
        const locationCol = columnMappings['location'];
        if (usernameCol && locationCol) {
          const managerRow = processedEmployees.find(e => e.originalRow[usernameCol] === managerName);
          if (managerRow) {
            managerLocation = managerRow.originalRow[locationCol] || '';
          }
        }
        newTreemapData.push({
          name: managerName,
          children: locationChildren,
          type: 'manager',
          path: managerName,
          value: managerTotalEmployees,
          itemStyle: { color: baseColor },
          managerLocation,
        });
      }
      managerIndex++;
    });
    setTreemapData(newTreemapData);
  }, [filteredEmployees, processedEmployees, columnMappings]); 
  
  const handleFilterChange = useCallback((filterName: keyof Pick<ActiveFilters, 'level' | 'employeeType' | 'teamProject'>, value: string) => {
    setActiveFilters(prev => {
      const prevArr = prev[filterName] as string[];
      let newArr: string[];
      if (prevArr.includes(value)) {
        newArr = prevArr.filter(v => v !== value);
      } else {
        newArr = [...prevArr, value];
      }
      return {
        ...prev,
        [filterName]: newArr,
        clickedManager: prev.clickedManager,
        clickedLocation: prev.clickedLocation,
      };
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setActiveFilters(initialActiveFilters);
    toast({ title: "Filters Reset", description: "Displaying all data." });
  }, [toast]);

  const handleNodeClick = useCallback((node: TreemapNode) => {
    if (node.type === 'manager') {
      setActiveFilters(prev => ({
        ...prev, 
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
        ...prev, 
        level: prev.level,
        employeeType: prev.employeeType,
        teamProject: prev.teamProject,
        clickedManager: managerName,
        clickedLocation: node.name,
      }));
      toast({ title: "Filtered by Location", description: `Showing data for ${node.name} under ${managerName}.` });
    }
  }, [toast]);

  // For mapping UI: fixed order for mapping fields
  const mappingOrder: TargetField[] = [
    'username',
    'manager',
    'location',
    'level',
    'employeeType',
    'teamProject',
  ];
  const requiredFields: TargetField[] = [
    'username',
    'manager',
    'location',
    'level',
    'employeeType',
  ];

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
          <div className="text-xs text-muted-foreground mb-2">
            <span className="text-red-500">*</span> Required fields. Team/Project is optional.
          </div>
          {mappingOrder.map(field => (
            <ColumnSelector
              key={field}
              fieldId={`map-${field}`}
              label={<span>{field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}{requiredFields.includes(field) ? <span className="text-red-500 ml-1">*</span> : <span className="text-xs text-muted-foreground ml-1">(optional)</span>}</span>}
              options={[...csvHeaders].sort((a, b) => a.localeCompare(b))}
              selectedValue={columnMappings[field]}
              onChange={(value) => handleMappingChange(field, value)}
              disabled={isMappingAi || csvHeaders.length === 0}
            />
          ))}
          <Button onClick={applyMappingsAndProcessData} disabled={isProcessingData || !requiredFields.every(f => columnMappings[f]) || csvRows.length === 0} className="w-full">
            {isProcessingData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Apply Mappings & Process Data
          </Button>
          {!requiredFields.every(f => columnMappings[f]) && csvHeaders.length > 0 && (
            <p className="text-xs text-red-500 text-center">Map all required fields to proceed.</p>
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
          onToggleDifferentCampusOnly={(value) => setActiveFilters(prev => ({ ...prev, differentCampusOnly: value }))}
          onToggleShowEmployeeCount={(value) => setActiveFilters(prev => ({ ...prev, showEmployeeCount: value }))}
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

      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0 flex-1">
        {/* Left Panel: Only render content if not collapsed */}
        {isLeftPanelCollapsed ? (
          <div className="relative">
            <Button
              variant="outline"
              size="icon"
              className="absolute top-0 -right-6 z-10"
              onClick={() => setIsLeftPanelCollapsed(false)}
              aria-label="Expand Controls"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="relative space-y-6 transition-all duration-300 ease-in-out w-full lg:w-1/3 min-w-0">
            <Button
              variant="outline"
              size="icon"
              className="absolute top-0 -right-6 z-10"
              onClick={() => setIsLeftPanelCollapsed(true)}
              aria-label="Collapse Controls"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {sections.map(section => section.show && (
              <Card key={section.title} className="shadow-md">
                <CardHeader className="flex flex-row items-center space-x-2 space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    {section.icon}
                    <CardTitle className="text-xl font-headline">{section.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {section.content}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {/* Treemap Panel: Always take full width if left panel is collapsed */}
        <div className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ease-in-out ${isLeftPanelCollapsed ? 'w-full' : 'w-full lg:w-2/3'}`}>
          <Card className="shadow-md h-[calc(100vh-1rem)] min-h-[400px] lg:h-full">
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
            <CardContent className="h-[calc(100%-8rem)]">
              {(activeFilters.clickedManager || activeFilters.clickedLocation) && (
                <div className="mb-2 flex justify-center">
                  <button
                    className="px-4 py-1 rounded bg-muted text-primary font-medium hover:bg-primary/10 transition"
                    onClick={() => setActiveFilters(prev => ({
                      ...prev,
                      clickedManager: null,
                      clickedLocation: null,
                    }))}
                  >
                    ← Back to Overview
                  </button>
                </div>
              )}
              <div className="mb-2 flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => treemapRef.current?.exportAsPng()}>
                  Export as PNG
                </Button>
                <Button size="sm" variant="outline" onClick={() => treemapRef.current?.exportAsHtml()}>
                  Export as HTML
                </Button>
              </div>
              {activeFilters.clickedManager && (
                <div className="mb-4 text-2xl font-bold text-center text-primary">
                  Manager: {activeFilters.clickedManager}
                </div>
              )}
              {(isParsing || isProcessingData) && !treemapData.length ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Loading data...</p>
                  </div>
              ) : processedEmployees.length > 0 ? (
                <OrgTreemapChartEcharts ref={treemapRef} data={treemapData} onNodeClick={handleNodeClick} showEmployeeCount={!!activeFilters.showEmployeeCount} />
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

