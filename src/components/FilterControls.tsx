"use client";

import React from 'react';
import type { ActiveFilters, FilterOptions } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Users, Briefcase, FolderKanban, RotateCcw, BarChart2, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

interface FilterControlsProps {
  options: FilterOptions;
  activeFilters: ActiveFilters;
  onFilterChange: (filterName: keyof Pick<ActiveFilters, 'level' | 'employeeType' | 'teamProject'>, value: string) => void;
  onResetFilters: () => void;
  onToggleDifferentCampusOnly: (value: boolean) => void;
  onToggleShowEmployeeCount: (value: boolean) => void;
  disabled?: boolean;
}

const filterConfig = [
  { id: 'level' as const, label: 'Level', icon: <BarChart2 className="h-4 w-4" /> },
  { id: 'employeeType' as const, label: 'Employee Type', icon: <Users className="h-4 w-4" /> },
  { id: 'teamProject' as const, label: 'Team/Project', icon: <FolderKanban className="h-4 w-4" /> },
] as const;

const renderMultiSelect = (
  id: keyof Pick<ActiveFilters, 'level' | 'employeeType' | 'teamProject'>,
  label: string,
  icon: React.ReactNode,
  incomingFilterOptions: string[],
  selected: string[],
  onChange: (value: string) => void,
  disabled: boolean
) => (
  <div key={id} className="space-y-1.5">
    <Label htmlFor={`filter-${id}`} className="flex items-center text-sm font-medium">
      {icon}
      <span className="ml-2">{label}</span>
    </Label>
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between" disabled={disabled}>
          <span>
            {selected.length === 0 ? `All ${label}s` : selected.join(', ')}
          </span>
          <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2">
        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
          {incomingFilterOptions.map((option, idx) => (
            <label key={option} className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-accent">
              <Checkbox
                checked={selected.includes(option)}
                onCheckedChange={() => onChange(option)}
                id={`checkbox-${id}-${option}`}
                disabled={disabled}
              />
              <span className="text-sm">{option}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  </div>
);

export function FilterControls({ options, activeFilters, onFilterChange, onResetFilters, onToggleDifferentCampusOnly, onToggleShowEmployeeCount, disabled = false }: FilterControlsProps) {
  return (
    <div className="space-y-4">
      {filterConfig.map((fc) => {
         const currentOptions = options[fc.id === 'teamProject' ? 'teamProjects' : fc.id === 'employeeType' ? 'employeeTypes' : 'levels'];
         return renderMultiSelect(
           fc.id,
           fc.label,
           fc.icon,
           currentOptions || [],
           activeFilters[fc.id],
           (value) => onFilterChange(fc.id, value),
           disabled || !currentOptions || currentOptions.length === 0
         );
      })}
      <div className="flex items-center gap-2">
        <Switch
          id="different-campus-switch"
          checked={!!activeFilters.differentCampusOnly}
          onCheckedChange={onToggleDifferentCampusOnly}
          disabled={disabled}
        />
        <label htmlFor="different-campus-switch" className="text-sm select-none cursor-pointer">
          Employees campus ≠ Manager campus
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="show-employee-count-switch"
          checked={!!activeFilters.showEmployeeCount}
          onCheckedChange={onToggleShowEmployeeCount}
          disabled={disabled}
        />
        <label htmlFor="show-employee-count-switch" className="text-sm select-none cursor-pointer">
          Show employee count in location boxes
        </label>
      </div>
      <Button onClick={onResetFilters} variant="outline" className="w-full" disabled={disabled}>
        <RotateCcw className="mr-2 h-4 w-4" /> Reset All Filters
      </Button>
    </div>
  );
}
