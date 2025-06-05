
"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ColumnSelectorProps {
  fieldId: string;
  label: string;
  options: string[]; // CSV headers
  selectedValue: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

const NOT_MAPPED_VALUE = "__NOT_MAPPED_INTERNAL_VALUE__";

export function ColumnSelector({ fieldId, label, options, selectedValue, onChange, disabled = false }: ColumnSelectorProps) {
  const handleValueChange = (value: string) => {
    if (value === NOT_MAPPED_VALUE) {
      onChange(null);
    } else {
      onChange(value);
    }
  };

  // If selectedValue is null, the Select component's value should be our special NOT_MAPPED_VALUE
  // to correctly show "-- Not Mapped --" as selected. Otherwise, it's the actual selected CSV header.
  const currentSelectValue = selectedValue === null ? NOT_MAPPED_VALUE : selectedValue;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldId} className="text-sm font-medium">
        {label}
      </Label>
      <Select
        value={currentSelectValue}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger id={fieldId} className="w-full">
          <SelectValue placeholder="Select CSV column..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NOT_MAPPED_VALUE}>-- Not Mapped --</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
