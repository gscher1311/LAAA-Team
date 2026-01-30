'use client';

import React, { useMemo } from 'react';
import { DealInputs } from '@/types/deal';
import { generateCondoSensitivity, generateRentalSensitivity } from '@/lib/calculations';
import { formatCurrency, cn } from '@/lib/utils';

interface SensitivityTablesProps {
  inputs: DealInputs;
}

export function SensitivityTables({ inputs }: SensitivityTablesProps) {
  const condoData = useMemo(() => generateCondoSensitivity(inputs), [inputs]);
  const rentalData = useMemo(() => generateRentalSensitivity(inputs), [inputs]);

  return (
    <div className="space-y-8">
      {/* Condo Sensitivity Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Condo Sensitivity: Sale $/SF vs. Hard Cost $/SF
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Residual land value at different sale price and construction cost combinations
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2 bg-gray-100 dark:bg-gray-800 font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  Hard $/SF ↓ Sale $/SF →
                </th>
                {condoData.cols.map((col) => (
                  <th
                    key={col}
                    className={cn(
                      'text-center p-2 font-medium whitespace-nowrap',
                      col === inputs.salePricePSF
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    )}
                  >
                    ${col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {condoData.rows.map((row, rowIdx) => (
                <tr key={row}>
                  <td
                    className={cn(
                      'p-2 font-medium whitespace-nowrap',
                      row === inputs.baseBuildingCostPSF
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400'
                    )}
                  >
                    ${row}
                  </td>
                  {condoData.values[rowIdx].map((value, colIdx) => {
                    const isCurrentCell =
                      row === inputs.baseBuildingCostPSF &&
                      condoData.cols[colIdx] === inputs.salePricePSF;
                    return (
                      <td
                        key={colIdx}
                        className={cn(
                          'text-center p-2 font-mono text-xs',
                          value >= 0
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
                          isCurrentCell && 'ring-2 ring-blue-500 ring-inset font-bold'
                        )}
                      >
                        {formatCurrency(value, { compact: true })}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          <span className="inline-block w-3 h-3 bg-green-100 dark:bg-green-900/40 mr-1 rounded" /> Positive residual (deal pencils)
          <span className="inline-block w-3 h-3 bg-red-100 dark:bg-red-900/40 ml-3 mr-1 rounded" /> Negative residual
          <span className="inline-block w-3 h-3 ring-2 ring-blue-500 ml-3 mr-1 rounded" /> Current assumptions
        </p>
      </div>

      {/* Rental Sensitivity Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Rental Sensitivity: Rent $/SF/Mo vs. Exit Cap Rate
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          YOC residual land value at different rent and cap rate combinations
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2 bg-gray-100 dark:bg-gray-800 font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  Cap % ↓ Rent $/SF →
                </th>
                {rentalData.cols.map((col) => (
                  <th
                    key={col}
                    className={cn(
                      'text-center p-2 font-medium whitespace-nowrap',
                      col === inputs.marketRentPSF
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    )}
                  >
                    ${col.toFixed(2)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rentalData.rows.map((row, rowIdx) => (
                <tr key={row}>
                  <td
                    className={cn(
                      'p-2 font-medium whitespace-nowrap',
                      row === inputs.exitCapRate
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400'
                    )}
                  >
                    {(row * 100).toFixed(2)}%
                  </td>
                  {rentalData.values[rowIdx].map((value, colIdx) => {
                    const isCurrentCell =
                      row === inputs.exitCapRate &&
                      rentalData.cols[colIdx] === inputs.marketRentPSF;
                    return (
                      <td
                        key={colIdx}
                        className={cn(
                          'text-center p-2 font-mono text-xs',
                          value >= 0
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
                          isCurrentCell && 'ring-2 ring-blue-500 ring-inset font-bold'
                        )}
                      >
                        {formatCurrency(value, { compact: true })}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          <span className="inline-block w-3 h-3 bg-green-100 dark:bg-green-900/40 mr-1 rounded" /> Positive residual (deal pencils)
          <span className="inline-block w-3 h-3 bg-red-100 dark:bg-red-900/40 ml-3 mr-1 rounded" /> Negative residual
          <span className="inline-block w-3 h-3 ring-2 ring-blue-500 ml-3 mr-1 rounded" /> Current assumptions
        </p>
      </div>
    </div>
  );
}
