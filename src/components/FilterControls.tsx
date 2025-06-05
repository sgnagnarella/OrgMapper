
"use client";

import React from 'react';
import { ActiveFilters, FilterOptions } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Users, Briefcase, FolderKanban, RotateCcw, BarChart2 } from 'lucide-react';

interface FilterControlsProps {
  options: FilterOptions;
  activeFilters: ActiveFilters;
  onFilterChange: (filterName: keyof Pick<ActiveFilters, 'level' | 'employeeType' | 'teamProject'>, value: string | null) => void;
  onResetFilters: () => void;
  disabled?: boolean;
}

const filterConfig = [
  { id: 'level', label: 'Level', icon: <BarChart2 className="h-4 w-4" /> },
  { id: 'employeeType', label: 'Employee Type', icon: <Users className="h-4 w-4" /> },
  { id: 'teamProject', label: 'Team/Project', icon: <FolderKanban className="h-4 w-4" /> },
] as const;


export function FilterControls({ options, activeFilters, onFilterChange, onResetFilters, disabled = false }: FilterControlsProps) {
  
  // Helper function to render a select filter
  const renderSelect = (
    id: keyof Pick<ActiveFilters, 'level' | 'employeeType' | 'teamProject'>,
    label: string,
    icon: React.ReactNode,
    filterOptions: string[]
  ) => (
    <div key={id} className="space-y-1.5">
      <Label htmlFor={`filter-${id}`} className="flex items-center text-sm font-medium">
        {icon}
        <span className="ml-2">{label}</span>
      </Label>
      <Select
        value={activeFilters[id] || ''}
        onValueChange={(value) => onFilterChange(id, value === '' ? null : value)}
        disabled={disabled || filterOptions.length === 0}
      >
        <SelectTrigger id={`filter-${id}`} className="w-full">
          <SelectValue placeholder={`Filter by ${label.toLowerCase()}...`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All {label}s</SelectItem>
          {filterOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-4">
      {filterConfig.map(fc => 
         renderSelect(fc.id as keyof Pick<ActiveFilters, 'level' | 'employeeType' | 'teamProject'>, fc.label, fc.icon, options[fc.id === 'teamProject' ? 'teamProjects' : fc.id === 'employeeType' ? 'employeeTypes' : 'levels'])
      )}
      <Button onClick={onResetFilters} variant="outline" className="w-full" disabled={disabled}>
        <RotateCcw className="mr-2 h-4 w-4" /> Reset All Filters
      </Button>
    </div>
  );
}
