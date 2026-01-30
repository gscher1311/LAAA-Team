'use client';

import React, { useState, useMemo } from 'react';
import { DealInputs, DealCalculations } from '@/types/deal';
import { calculateDeal } from '@/lib/calculations';
import { formatCurrency, cn } from '@/lib/utils';

interface CompareDeal {
  id: string;
  name: string;
  inputs: DealInputs;
  calculations: DealCalculations;
}

interface DealComparisonProps {
  savedDeals: Array<{
    id: string;
    name: string;
    inputs: DealInputs;
    createdAt: string;
    updatedAt: string;
  }>;
  onClose: () => void;
}

export function DealComparison({ savedDeals, onClose }: DealComparisonProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const maxDeals = 3;

  // Convert selected deals to comparison format with calculations
  const compareDeals = useMemo(() => {
    return selectedIds
      .map((id) => {
        const deal = savedDeals.find((d) => d.id === id);
        if (!deal) return null;
        return {
          id: deal.id,
          name: deal.name,
          inputs: deal.inputs,
          calculations: calculateDeal(deal.inputs),
        };
      })
      .filter((d): d is CompareDeal => d !== null);
  }, [selectedIds, savedDeals]);

  const toggleDeal = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= maxDeals) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const clearSelection = () => setSelectedIds([]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Compare Deals
            </h2>
            <p className="text-sm text-gray-500">
              Select up to {maxDeals} deals to compare side-by-side
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Deal Selector */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">Select deals:</span>
            {savedDeals.map((deal) => (
              <button
                key={deal.id}
                onClick={() => toggleDeal(deal.id)}
                disabled={!selectedIds.includes(deal.id) && selectedIds.length >= maxDeals}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  selectedIds.includes(deal.id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600',
                  !selectedIds.includes(deal.id) && selectedIds.length >= maxDeals && 'opacity-50 cursor-not-allowed'
                )}
              >
                {deal.name}
              </button>
            ))}
            {selectedIds.length > 0 && (
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="flex-1 overflow-auto p-4">
          {compareDeals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <p className="text-lg mb-2">Select deals to compare</p>
              <p className="text-sm">Choose up to {maxDeals} deals from the buttons above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 w-48">Metric</th>
                    {compareDeals.map((deal) => (
                      <th key={deal.id} className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                        {deal.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Property Info */}
                  <SectionHeader title="Property Info" colSpan={compareDeals.length + 1} />
                  <CompareRow label="Address" deals={compareDeals} getValue={(d) => d.inputs.propertyAddress || '-'} />
                  <CompareRow label="Lot Size (SF)" deals={compareDeals} getValue={(d) => d.inputs.lotSize.toLocaleString()} />
                  <CompareRow label="Units" deals={compareDeals} getValue={(d) => d.inputs.units.toString()} />
                  <CompareRow label="Avg Unit SF" deals={compareDeals} getValue={(d) => d.inputs.avgUnitSF.toLocaleString()} />
                  <CompareRow label="Stories" deals={compareDeals} getValue={(d) => d.inputs.stories.toString()} />
                  <CompareRow label="Total Building SF" deals={compareDeals} getValue={(d) => d.calculations.grossBuildingSF.toLocaleString()} />

                  {/* Revenue */}
                  <SectionHeader title="Revenue Assumptions" colSpan={compareDeals.length + 1} />
                  <CompareRow label="Sale Price PSF" deals={compareDeals} getValue={(d) => formatCurrency(d.inputs.salePricePSF)} />
                  <CompareRow label="Gross Revenue" deals={compareDeals} getValue={(d) => formatCurrency(d.calculations.grossSalesRevenue)} />
                  <CompareRow label="Net Revenue" deals={compareDeals} getValue={(d) => formatCurrency(d.calculations.netSalesRevenue)} />

                  {/* Cost Stack */}
                  <SectionHeader title="Cost Stack" colSpan={compareDeals.length + 1} />
                  <CompareRow label="Hard Costs" deals={compareDeals} getValue={(d) => formatCurrency(d.calculations.totalHardCosts)} />
                  <CompareRow label="Soft Costs" deals={compareDeals} getValue={(d) => formatCurrency(d.calculations.totalSoftCosts)} />
                  <CompareRow label="Financing" deals={compareDeals} getValue={(d) => formatCurrency(d.calculations.totalFinancingCarry)} />
                  <CompareRow label="Total Cost (ex-Land)" deals={compareDeals} getValue={(d) => formatCurrency(d.calculations.totalDevCostExLand)} highlight />
                  <CompareRow label="Cost per SF" deals={compareDeals} getValue={(d) => formatCurrency(d.calculations.totalDevCostExLand / d.calculations.grossBuildingSF)} />
                  <CompareRow label="Cost per Unit" deals={compareDeals} getValue={(d) => formatCurrency(d.calculations.totalDevCostExLand / d.inputs.units)} />

                  {/* Land Residual Analysis */}
                  <SectionHeader title="Land Residual Analysis" colSpan={compareDeals.length + 1} />
                  <CompareRow
                    label="Condo Residual"
                    deals={compareDeals}
                    getValue={(d) => formatCurrency(d.calculations.residualLandCondo)}
                    highlight
                    highlightBest
                  />
                  <CompareRow
                    label="YOC Residual"
                    deals={compareDeals}
                    getValue={(d) => formatCurrency(d.calculations.residualYOC)}
                    highlightBest
                  />
                  <CompareRow
                    label="Dev Margin Residual"
                    deals={compareDeals}
                    getValue={(d) => formatCurrency(d.calculations.residualDevMargin)}
                    highlightBest
                  />
                  <CompareRow
                    label="Equity Multiple Residual"
                    deals={compareDeals}
                    getValue={(d) => formatCurrency(d.calculations.residualEquityMultiple)}
                    highlightBest
                  />
                  <CompareRow
                    label="Levered IRR Residual"
                    deals={compareDeals}
                    getValue={(d) => formatCurrency(d.calculations.residualLeveredIRR)}
                    highlightBest
                  />
                  <CompareRow
                    label="Unlevered ROC Residual"
                    deals={compareDeals}
                    getValue={(d) => formatCurrency(d.calculations.residualUnleveredROC)}
                    highlightBest
                  />

                  {/* Per-Unit/SF Metrics */}
                  <SectionHeader title="Per-Unit Metrics" colSpan={compareDeals.length + 1} />
                  <CompareRow
                    label="Residual per Unit"
                    deals={compareDeals}
                    getValue={(d) => formatCurrency(d.calculations.primaryPerUnit)}
                    highlightBest
                  />
                  <CompareRow
                    label="Residual per Land SF"
                    deals={compareDeals}
                    getValue={(d) => formatCurrency(d.calculations.primaryPerSFLand)}
                    highlightBest
                  />

                  {/* Target Assumptions */}
                  <SectionHeader title="Target Assumptions" colSpan={compareDeals.length + 1} />
                  <CompareRow label="Profit Margin Target" deals={compareDeals} getValue={(d) => `${(d.inputs.condoProfitMargin * 100).toFixed(1)}%`} />
                  <CompareRow label="YOC Target" deals={compareDeals} getValue={(d) => `${(d.inputs.yocTarget * 100).toFixed(2)}%`} />
                  <CompareRow label="Exit Cap Rate" deals={compareDeals} getValue={(d) => `${(d.inputs.exitCapRate * 100).toFixed(2)}%`} />
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, colSpan }: { title: string; colSpan: number }) {
  return (
    <tr className="bg-gray-100 dark:bg-gray-800">
      <td colSpan={colSpan} className="py-2 px-4 font-semibold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wider">
        {title}
      </td>
    </tr>
  );
}

function CompareRow({
  label,
  deals,
  getValue,
  highlight,
  highlightBest,
}: {
  label: string;
  deals: CompareDeal[];
  getValue: (deal: CompareDeal) => string;
  highlight?: boolean;
  highlightBest?: boolean;
}) {
  // Find best value for highlighting (assumes higher is better for numeric values)
  let bestIndex = -1;
  if (highlightBest && deals.length > 1) {
    const values = deals.map((d) => {
      const val = getValue(d);
      const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? -Infinity : num;
    });
    const maxVal = Math.max(...values);
    if (maxVal > -Infinity) {
      bestIndex = values.indexOf(maxVal);
    }
  }

  return (
    <tr className={cn(
      'border-b border-gray-100 dark:border-gray-800',
      highlight && 'bg-blue-50 dark:bg-blue-900/10'
    )}>
      <td className={cn(
        'py-2 px-4 text-gray-600 dark:text-gray-400',
        highlight && 'font-medium text-gray-900 dark:text-gray-100'
      )}>
        {label}
      </td>
      {deals.map((deal, idx) => (
        <td
          key={deal.id}
          className={cn(
            'py-2 px-4 text-right font-medium',
            idx === bestIndex
              ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10'
              : 'text-gray-900 dark:text-gray-100'
          )}
        >
          {getValue(deal)}
        </td>
      ))}
    </tr>
  );
}
