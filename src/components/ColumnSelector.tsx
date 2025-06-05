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

export function ColumnSelector({ fieldId, label, options, selectedValue, onChange, disabled = false }: ColumnSelectorProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldId} className="text-sm font-medium">
        {label}
      </Label>
      <Select
        value={selectedValue || ''}
        onValueChange={(value) => onChange(value === '' ? null : value)}
        disabled={disabled}
      >
        <SelectTrigger id={fieldId} className="w-full">
          <SelectValue placeholder="Select CSV column..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">-- Not Mapped --</SelectItem>
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
