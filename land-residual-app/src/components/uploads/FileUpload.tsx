'use client';

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSize?: number; // in bytes
  label?: string;
  description?: string;
  className?: string;
}

export function FileUpload({
  onUpload,
  accept = '.pdf',
  maxSize = 10 * 1024 * 1024, // 10MB default
  label = 'Upload Document',
  description = 'PDF files up to 10MB',
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    // Validate file type
    const acceptedTypes = accept.split(',').map(t => t.trim().toLowerCase());
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.some(t => fileExt === t || file.type.includes(t.replace('.', '')))) {
      setError(`Invalid file type. Accepted: ${accept}`);
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [accept, maxSize, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFile]);

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors',
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
          isUploading && 'pointer-events-none opacity-50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="sr-only"
        />

        <div className="text-center">
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" />
              <span className="text-sm text-gray-500">Uploading...</span>
            </div>
          ) : (
            <>
              <svg
                className="mx-auto h-10 w-10 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="text-blue-600 hover:text-blue-500">Click to upload</span>
                {' '}or drag and drop
              </p>
              <p className="mt-1 text-xs text-gray-500">{description}</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

interface ZIMASUploadProps {
  onDataExtracted: (data: Record<string, unknown>) => void;
  className?: string;
}

export function ZIMASUpload({ onDataExtracted, className }: ZIMASUploadProps) {
  const [result, setResult] = useState<{
    success: boolean;
    data?: {
      zimas: Record<string, unknown>;
      inputs: Record<string, unknown>;
      validation: { isValid: boolean; errors: string[]; warnings: string[] };
    };
    error?: string;
  } | null>(null);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/parse-zimas', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      setResult({ success: true, data: data.data });
    } else {
      throw new Error(data.error || 'Failed to parse ZIMAS PDF');
    }
  };

  const handleApply = () => {
    if (result?.data?.inputs) {
      onDataExtracted(result.data.inputs);
      setResult(null);
    }
  };

  return (
    <div className={className}>
      <FileUpload
        onUpload={handleUpload}
        accept=".pdf"
        label="Upload ZIMAS Report"
        description="Upload a ZIMAS Parcel Profile PDF to auto-fill property data"
      />

      {result && (
        <div className="mt-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {result.success ? (
            <>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                Extracted Data
              </h4>

              {result.data?.validation.errors.length ? (
                <div className="mb-3 p-3 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Errors:</p>
                  <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside">
                    {result.data.validation.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {result.data?.validation.warnings.length ? (
                <div className="mb-3 p-3 rounded bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">Warnings:</p>
                  <ul className="text-sm text-yellow-600 dark:text-yellow-400 list-disc list-inside">
                    {result.data.validation.warnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                {Object.entries(result.data?.inputs || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-500">{key}:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleApply}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Apply to Deal
                </button>
                <button
                  onClick={() => setResult(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="text-red-600 dark:text-red-400">
              {result.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
