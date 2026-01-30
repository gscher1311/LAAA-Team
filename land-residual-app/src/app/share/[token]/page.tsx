'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { DealInputs, DealCalculations, SanityCheck } from '@/types/deal';

interface ShareData {
  success: boolean;
  share_type: 'summary' | 'full';
  deal: {
    name: string;
    propertyAddress: string;
    updatedAt: string;
  };
  summary?: {
    lotSize: number;
    units: number;
    totalBuildingSF: number;
    condoResidual: number;
    yocResidual: number;
    devMarginResidual: number;
    equityMultipleResidual: number;
    leveredIRRResidual: number;
    unleveredROCResidual: number;
    residualPerUnit: number;
    residualPerSF: number;
    salePricePSF: number;
    baseBuildingCostPSF: number;
    condoProfitMargin: number;
  };
  inputs?: DealInputs;
  calculations?: DealCalculations;
  sanityChecks?: SanityCheck[];
  error?: string;
}

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadShare() {
      try {
        const response = await fetch(`/api/shares/view?token=${token}`);
        const result = await response.json();

        if (result.success) {
          setData(result);
        } else {
          setError(result.error || 'Failed to load shared deal');
        }
      } catch (err) {
        setError('Failed to load shared deal');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadShare();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-8 max-w-md text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Link Unavailable
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {error || 'This share link is invalid or has expired.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {data.deal.name}
              </h1>
              {data.deal.propertyAddress && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {data.deal.propertyAddress}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Last updated: {new Date(data.deal.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
              Land Residual Analysis
            </div>
          </div>
        </div>

        {/* Summary View */}
        {data.share_type === 'summary' && data.summary && (
          <>
            {/* Property Overview */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Property Overview
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {data.summary.lotSize.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">Lot Size (SF)</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {data.summary.units}
                  </p>
                  <p className="text-sm text-gray-500">Units</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {data.summary.totalBuildingSF.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">Building SF</p>
                </div>
              </div>
            </div>

            {/* Residual Values */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Land Residual Analysis
              </h2>
              <div className="space-y-3">
                <ResidualRow label="Condo Residual" value={data.summary.condoResidual} highlight />
                <ResidualRow label="YOC Residual" value={data.summary.yocResidual} />
                <ResidualRow label="Dev Margin Residual" value={data.summary.devMarginResidual} />
                <ResidualRow label="Equity Multiple Residual" value={data.summary.equityMultipleResidual} />
                <ResidualRow label="Levered IRR Residual" value={data.summary.leveredIRRResidual} />
                <ResidualRow label="Unlevered ROC Residual" value={data.summary.unleveredROCResidual} />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(data.summary.residualPerUnit)}
                  </p>
                  <p className="text-sm text-gray-500">Per Unit</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(data.summary.residualPerSF)}
                  </p>
                  <p className="text-sm text-gray-500">Per Land SF</p>
                </div>
              </div>
            </div>

            {/* Key Assumptions */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Key Assumptions
              </h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Sale Price</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(data.summary.salePricePSF)}/SF
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Build Cost</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(data.summary.baseBuildingCostPSF)}/SF
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Profit Margin</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {(data.summary.condoProfitMargin * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {data.sanityChecks && data.sanityChecks.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Notes
                </h2>
                <div className="space-y-2">
                  {data.sanityChecks.map((check, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg text-sm ${
                        check.type === 'warning'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {check.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Full View - includes all detailed data */}
        {data.share_type === 'full' && data.calculations && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Full Analysis Data
            </h2>
            <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify({ inputs: data.inputs, calculations: data.calculations }, null, 2)}
            </pre>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Generated by LAAA Land Residual Analysis Tool</p>
          <p className="mt-1">This is a shared view. For full access, contact the deal owner.</p>
        </div>
      </div>
    </div>
  );
}

function ResidualRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-2 px-3 rounded-lg ${
      highlight ? 'bg-blue-50 dark:bg-blue-900/20' : ''
    }`}>
      <span className={highlight ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}>
        {label}
      </span>
      <span className={`font-semibold ${
        value >= 0 ? 'text-green-600' : 'text-red-600'
      }`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}
