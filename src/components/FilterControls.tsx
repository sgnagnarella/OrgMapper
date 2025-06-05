
"use client";

import React from 'react';
import type { ActiveFilters, FilterOptions } from '@/types';
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
  { id: 'level' as const, label: 'Level', icon: <BarChart2 className="h-4 w-4" /> },
  { id: 'employeeType' as const, label: 'Employee Type', icon: <Users className="h-4 w-4" /> },
  { id: 'teamProject' as const, label: 'Team/Project', icon: <FolderKanban className="h-4 w-4" /> },
] as const;


export function FilterControls({ options, activeFilters, onFilterChange, onResetFilters, disabled = false }: FilterControlsProps) {

  const renderSelect = (
    id: keyof Pick<ActiveFilters, 'level' | 'employeeType' | 'teamProject'>,
    label: string,
    icon: React.ReactNode,
    incomingFilterOptions: string[]
  ) => (
    <div key={id} className="space-y-1.5">
      <Label htmlFor={`filter-${id}`} className="flex items-center text-sm font-medium">
        {icon}
        <span className="ml-2">{label}</span>
      </Label>
      <Select
        value={activeFilters[id] || ''}
        onValueChange={(value) => onFilterChange(id, value === '' ? null : value)}
        disabled={disabled || !incomingFilterOptions || incomingFilterOptions.length === 0}
      >
        <SelectTrigger id={`filter-${id}`} className="w-full">
          <SelectValue placeholder={`Filter by ${label.toLowerCase()}...`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All {label}s</SelectItem>
          {/* Ensure options are robustly filtered for non-empty strings before mapping */}
          {(incomingFilterOptions || []) // Handle case where incomingFilterOptions might be undefined/null
            .filter(option => typeof option === 'string' && option !== '') // Ensure it's a non-empty string
            .map((option, index) => (
              <SelectItem key={`${id}-${option}-${index}`} value={option}>
                {option}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-4">
      {filterConfig.map(fc => {
         const currentOptions = options[fc.id === 'teamProject' ? 'teamProjects' : fc.id === 'employeeType' ? 'employeeTypes' : 'levels'];
         return renderSelect(fc.id, fc.label, fc.icon, currentOptions || []);
      })}
      <Button onClick={onResetFilters} variant="outline" className="w-full" disabled={disabled}>
        <RotateCcw className="mr-2 h-4 w-4" /> Reset All Filters
      </Button>
    </div>
  );
}
