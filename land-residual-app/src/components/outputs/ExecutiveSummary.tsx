'use client';

import React from 'react';
import { DealInputs, DealCalculations, SanityCheck } from '@/types/deal';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ExecutiveSummaryProps {
  inputs: DealInputs;
  calculations: DealCalculations;
  sanityChecks: SanityCheck[];
}

export function ExecutiveSummary({ inputs, calculations, sanityChecks }: ExecutiveSummaryProps) {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div id="executive-summary" className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 space-y-8 max-w-4xl mx-auto print:shadow-none print:max-w-none">
      {/* Header */}
      <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
        <div className="text-sm text-gray-500 mb-2">LAAA Team</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          LAND RESIDUAL ANALYSIS
        </h1>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
          {inputs.propertyAddress || 'Property Address TBD'}
        </p>
        <p className="text-sm text-gray-500 mt-1">Generated: {generatedDate}</p>
      </div>

      {/* Deal Overview Table */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Deal Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Property:</span>
              <span className="font-medium">{inputs.propertyAddress || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">APN:</span>
              <span className="font-medium">{inputs.apn || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Lot Size:</span>
              <span className="font-medium">{formatNumber(inputs.lotSize)} SF</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Units:</span>
              <span className="font-medium">{inputs.units}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Zoning:</span>
              <span className="font-medium">{inputs.zoning}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Product Type:</span>
              <span className="font-medium">{inputs.productType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">HBU:</span>
              <span className="font-medium">{inputs.hbu}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Jurisdiction:</span>
              <span className="font-medium">{inputs.jurisdiction}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Avg Unit SF:</span>
              <span className="font-medium">{formatNumber(inputs.avgUnitSF)} SF</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Sellable SF:</span>
              <span className="font-medium">{formatNumber(calculations.totalSellableSF)} SF</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Gross Bldg SF:</span>
              <span className="font-medium">{formatNumber(Math.round(calculations.grossBuildingSF))} SF</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Construction:</span>
              <span className="font-medium">{inputs.constructionType}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">ULA Applied:</span>
              <span className="font-medium">{inputs.applyULA ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Exit Strategy:</span>
              <span className="font-medium">{inputs.rentalExitStrategy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Parking:</span>
              <span className="font-medium">{inputs.parkingType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Stories:</span>
              <span className="font-medium">{inputs.stories}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Primary Result Box */}
      <section className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
        <div className="text-center">
          <h2 className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-2">
            Primary Residual Land Value
          </h2>
          <p className="text-4xl font-bold text-blue-900 dark:text-blue-100 mb-1">
            {formatCurrency(calculations.primaryResidual)}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
            Method: {calculations.primaryResidualMethod}
          </p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-blue-600 dark:text-blue-400">Per Unit</p>
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                {formatCurrency(calculations.primaryPerUnit)}
              </p>
            </div>
            <div>
              <p className="text-blue-600 dark:text-blue-400">Per SF Land</p>
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                {formatCurrency(calculations.primaryPerSFLand)}
              </p>
            </div>
            <div>
              <p className="text-blue-600 dark:text-blue-400">Per Buildable SF</p>
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                {formatCurrency(calculations.primaryPerBuildableSF)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Listing Range */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Primary Listing Range
          </h3>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(calculations.listingRangeLow, { compact: true })} — {formatCurrency(calculations.listingRangeHigh, { compact: true })}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Full Buyer Spectrum
          </h3>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(calculations.fullBuyerSpectrumLow, { compact: true })} — {formatCurrency(calculations.fullBuyerSpectrumHigh, { compact: true })}
          </p>
        </div>
      </section>

      {/* Development Cost Waterfall */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Development Cost Waterfall
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400">Total Hard Costs</span>
            <span className="font-medium">{formatCurrency(calculations.totalHardCosts)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400">Total Soft Costs</span>
            <span className="font-medium">{formatCurrency(calculations.totalSoftCosts)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400">Total Financing & Carry</span>
            <span className="font-medium">{formatCurrency(calculations.totalFinancingCarry)}</span>
          </div>
          <div className="flex justify-between py-3 bg-gray-100 dark:bg-gray-800 px-3 rounded font-semibold">
            <span>Total Dev Cost (ex-Land)</span>
            <span>{formatCurrency(calculations.totalDevCostExLand)}</span>
          </div>
        </div>
      </section>

      {/* All Methods Comparison */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          All Residual Methods Comparison
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 font-medium text-gray-500">Method</th>
                <th className="text-right py-2 font-medium text-gray-500">Residual</th>
                <th className="text-right py-2 font-medium text-gray-500">Per Unit</th>
                <th className="text-right py-2 font-medium text-gray-500">Per SF Land</th>
                <th className="text-right py-2 font-medium text-gray-500">Land %</th>
              </tr>
            </thead>
            <tbody>
              <MethodRow
                name="For-Sale Condos"
                residual={calculations.residualLandCondo}
                units={inputs.units}
                lotSize={inputs.lotSize}
                devCost={calculations.totalDevCostExLand}
                isPrimary={calculations.primaryResidualMethod === 'For-Sale Condos'}
              />
              <MethodRow
                name="Rental — YOC"
                residual={calculations.residualYOC}
                units={inputs.units}
                lotSize={inputs.lotSize}
                devCost={calculations.totalDevCostExLand}
                isPrimary={calculations.primaryResidualMethod === 'Rental - YOC'}
              />
              <MethodRow
                name="Rental — Dev Margin"
                residual={calculations.residualDevMargin}
                units={inputs.units}
                lotSize={inputs.lotSize}
                devCost={calculations.totalDevCostExLand}
              />
              <MethodRow
                name={`Rental — EM ${inputs.targetEquityMultiple}x`}
                residual={calculations.residualEquityMultiple}
                units={inputs.units}
                lotSize={inputs.lotSize}
                devCost={calculations.totalDevCostExLand}
              />
              <MethodRow
                name={`Rental — IRR ${formatPercent(inputs.targetLeveredIRR, { decimals: 0 })}`}
                residual={calculations.residualLeveredIRR}
                units={inputs.units}
                lotSize={inputs.lotSize}
                devCost={calculations.totalDevCostExLand}
              />
              <MethodRow
                name="Rental — Unlev ROC"
                residual={calculations.residualUnleveredROC}
                units={inputs.units}
                lotSize={inputs.lotSize}
                devCost={calculations.totalDevCostExLand}
              />
            </tbody>
          </table>
        </div>
      </section>

      {/* Key Metrics */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Key Metrics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="YOC at Residual"
            value={formatPercent(calculations.yocAtResidual, { decimals: 2 })}
          />
          <MetricCard
            label="Dev Spread"
            value={`${Math.round(calculations.devSpreadBps)} bps`}
            warning={calculations.devSpreadBps < 100}
          />
          <MetricCard
            label="Exit Cap Rate"
            value={formatPercent(inputs.exitCapRate, { decimals: 2 })}
          />
          <MetricCard
            label="NOI per Unit"
            value={formatCurrency(calculations.noiPerUnit)}
          />
          <MetricCard
            label="Expense Ratio"
            value={formatPercent(calculations.expenseRatio, { decimals: 1 })}
            warning={calculations.expenseRatio > 0.40}
          />
          <MetricCard
            label="GRM"
            value={calculations.grm.toFixed(1)}
            warning={calculations.grm < 10 || calculations.grm > 18}
          />
          <MetricCard
            label="ULA Rate Applied"
            value={calculations.ulaAmount > 0 ? formatPercent(calculations.ulaAmount / calculations.stabilizedValue, { decimals: 1 }) : 'N/A'}
          />
          <MetricCard
            label="AHLF Total"
            value={formatCurrency(calculations.ahlfFees)}
          />
        </div>
      </section>

      {/* Sanity Checks */}
      {sanityChecks.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Warnings & Notes
          </h2>
          <div className="space-y-2">
            {sanityChecks.map((check) => (
              <div
                key={check.id}
                className={cn(
                  'flex items-start gap-2 p-3 rounded-lg text-sm',
                  check.type === 'warning' && 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
                  check.type === 'error' && 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200',
                  check.type === 'info' && 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
                )}
              >
                <span className="flex-shrink-0">
                  {check.type === 'warning' && '⚠️'}
                  {check.type === 'error' && '❌'}
                  {check.type === 'info' && 'ℹ️'}
                </span>
                <span>{check.message}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <section className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-8">
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          <strong>Disclaimer:</strong> This analysis is for informational purposes only and does not
          constitute an appraisal or guarantee of value. Actual results may vary based on market
          conditions, construction costs, and other factors. LAAA Team makes no warranties
          regarding the accuracy of projections. All assumptions should be independently verified.
        </p>
      </section>
    </div>
  );
}

// Helper Components
function MethodRow({
  name,
  residual,
  units,
  lotSize,
  devCost,
  isPrimary = false,
}: {
  name: string;
  residual: number;
  units: number;
  lotSize: number;
  devCost: number;
  isPrimary?: boolean;
}) {
  const perUnit = residual / units;
  const perSF = residual / lotSize;
  const landPct = residual / (residual + devCost);

  return (
    <tr
      className={cn(
        'border-b border-gray-100 dark:border-gray-800',
        isPrimary && 'bg-blue-50 dark:bg-blue-900/20 font-semibold',
        residual < 0 && 'text-red-600 dark:text-red-400'
      )}
    >
      <td className="py-2">
        {name}
        {isPrimary && <span className="ml-2 text-xs text-blue-600">★ PRIMARY</span>}
      </td>
      <td className="text-right py-2">{formatCurrency(residual)}</td>
      <td className="text-right py-2">{formatCurrency(perUnit)}</td>
      <td className="text-right py-2">{formatCurrency(perSF)}</td>
      <td className="text-right py-2">{residual > 0 ? formatPercent(landPct, { decimals: 1 }) : '—'}</td>
    </tr>
  );
}

function MetricCard({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg text-center',
        warning
          ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700'
          : 'bg-gray-50 dark:bg-gray-800'
      )}
    >
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p
        className={cn(
          'font-semibold',
          warning ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-900 dark:text-gray-100'
        )}
      >
        {value}
      </p>
    </div>
  );
}
