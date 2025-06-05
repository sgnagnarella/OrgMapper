"use client";

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud, Loader2 } from 'lucide-react';

interface FileUploadButtonProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function FileUploadButton({ onFileSelect, isLoading = false, disabled = false }: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset file input to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        style={{ display: 'none' }}
        disabled={isLoading || disabled}
      />
      <Button onClick={handleButtonClick} disabled={isLoading || disabled} className="w-full">
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UploadCloud className="mr-2 h-4 w-4" />
        )}
        {isLoading ? 'Processing...' : 'Upload CSV'}
      </Button>
    </>
  );
}
