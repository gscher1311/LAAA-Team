'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface BaseFieldProps {
  label: string;
  tooltip?: string;
  error?: string;
  className?: string;
  required?: boolean;
}

// Text Input
interface TextInputProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TextInput({
  label,
  value,
  onChange,
  tooltip,
  error,
  placeholder,
  disabled,
  className,
  required,
}: TextInputProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {tooltip && (
          <span className="ml-1 text-gray-400 cursor-help" title={tooltip}>
            ?
          </span>
        )}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 border rounded-md text-sm',
          'bg-white dark:bg-gray-800',
          'border-gray-300 dark:border-gray-600',
          'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
          error && 'border-red-500'
        )}
      />
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

// Number Input with formatting
interface NumberInputProps extends BaseFieldProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  disabled?: boolean;
  decimals?: number;
}

export function NumberInput({
  label,
  value,
  onChange,
  tooltip,
  error,
  min,
  max,
  prefix,
  suffix,
  disabled,
  className,
  required,
  decimals = 0,
}: NumberInputProps) {
  const [localValue, setLocalValue] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Compute formatted display value
  const formattedValue = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }, [value, decimals]);

  // Show local value when editing, formatted value otherwise
  const displayValue = isFocused && localValue !== null ? localValue : formattedValue;

  const handleFocus = () => {
    setIsFocused(true);
    setLocalValue(value.toString());
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (localValue !== null) {
      const parsed = parseFloat(localValue.replace(/[^0-9.-]/g, '')) || 0;
      const clamped = Math.min(Math.max(parsed, min ?? -Infinity), max ?? Infinity);
      onChange(clamped);
    }
    setLocalValue(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {tooltip && (
          <span className="ml-1 text-gray-400 cursor-help" title={tooltip}>
            ?
          </span>
        )}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn(
            'w-full px-3 py-2 border rounded-md text-sm text-right',
            'bg-white dark:bg-gray-800',
            'border-gray-300 dark:border-gray-600',
            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
            prefix && 'pl-7',
            suffix && 'pr-10',
            error && 'border-red-500'
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

// Currency Input
interface CurrencyInputProps extends BaseFieldProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function CurrencyInput({
  label,
  value,
  onChange,
  tooltip,
  error,
  disabled,
  className,
  required,
}: CurrencyInputProps) {
  return (
    <NumberInput
      label={label}
      value={value}
      onChange={onChange}
      tooltip={tooltip}
      error={error}
      prefix="$"
      disabled={disabled}
      className={className}
      required={required}
      decimals={0}
    />
  );
}

// Percentage Input
interface PercentInputProps extends BaseFieldProps {
  value: number; // Stored as decimal (0.05 = 5%)
  onChange: (value: number) => void;
  disabled?: boolean;
  decimals?: number;
}

export function PercentInput({
  label,
  value,
  onChange,
  tooltip,
  error,
  disabled,
  className,
  required,
  decimals = 1,
}: PercentInputProps) {
  const [localValue, setLocalValue] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Compute formatted display value
  const formattedValue = useMemo(() => {
    return (value * 100).toFixed(decimals);
  }, [value, decimals]);

  // Show local value when editing, formatted value otherwise
  const displayValue = isFocused && localValue !== null ? localValue : formattedValue;

  const handleFocus = () => {
    setIsFocused(true);
    setLocalValue((value * 100).toString());
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (localValue !== null) {
      const parsed = parseFloat(localValue.replace(/[^0-9.-]/g, '')) || 0;
      onChange(parsed / 100);
    }
    setLocalValue(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {tooltip && (
          <span className="ml-1 text-gray-400 cursor-help" title={tooltip}>
            ?
          </span>
        )}
      </label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn(
            'w-full px-3 py-2 pr-8 border rounded-md text-sm text-right',
            'bg-white dark:bg-gray-800',
            'border-gray-300 dark:border-gray-600',
            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
            error && 'border-red-500'
          )}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
          %
        </span>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

// Select Dropdown
interface SelectInputProps<T extends string> extends BaseFieldProps {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
}

export function SelectInput<T extends string>({
  label,
  value,
  onChange,
  options,
  tooltip,
  error,
  disabled,
  className,
  required,
}: SelectInputProps<T>) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {tooltip && (
          <span className="ml-1 text-gray-400 cursor-help" title={tooltip}>
            ?
          </span>
        )}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 border rounded-md text-sm',
          'bg-white dark:bg-gray-800',
          'border-gray-300 dark:border-gray-600',
          'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
          error && 'border-red-500'
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

// Toggle/Checkbox
interface ToggleInputProps extends Omit<BaseFieldProps, 'error'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function ToggleInput({
  label,
  checked,
  onChange,
  tooltip,
  disabled,
  className,
}: ToggleInputProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {tooltip && (
          <span className="ml-1 text-gray-400 cursor-help" title={tooltip}>
            ?
          </span>
        )}
      </label>
    </div>
  );
}

// Calculated Display Field (read-only)
interface DisplayFieldProps {
  label: string;
  value: string | number;
  format?: 'currency' | 'number' | 'percent' | 'text';
  className?: string;
  highlight?: boolean;
}

export function DisplayField({
  label,
  value,
  format = 'text',
  className,
  highlight,
}: DisplayFieldProps) {
  let displayValue: string;

  if (typeof value === 'number') {
    switch (format) {
      case 'currency':
        displayValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(value);
        break;
      case 'percent':
        displayValue = `${(value * 100).toFixed(1)}%`;
        break;
      case 'number':
        displayValue = new Intl.NumberFormat('en-US').format(value);
        break;
      default:
        displayValue = value.toString();
    }
  } else {
    displayValue = value;
  }

  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
        {label}
      </label>
      <div
        className={cn(
          'px-3 py-2 rounded-md text-sm font-semibold text-right',
          highlight
            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
        )}
      >
        {displayValue}
      </div>
    </div>
  );
}
