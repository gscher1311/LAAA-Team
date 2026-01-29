'use client';

import React, { useState } from 'react';
import { DealProvider, useDeal } from '@/context/DealContext';
import { PasswordGate, LogoutButton } from '@/components/auth/PasswordGate';
import { DealForm } from '@/components/forms/DealForm';
import { ExecutiveSummary } from '@/components/outputs/ExecutiveSummary';
import { SensitivityTables } from '@/components/outputs/SensitivityTables';
import { DealManager } from '@/components/DealManager';
import { ZIMASUpload } from '@/components/uploads/FileUpload';
import { ShareManager } from '@/components/sharing/ShareManager';
import { DealComparison } from '@/components/comparison/DealComparison';
import { exportToPDF, printReport } from '@/lib/pdfExport';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { DealInputs } from '@/types/deal';

type ViewMode = 'inputs' | 'summary' | 'sensitivity';

function AppContent() {
  const {
    inputs,
    calculations,
    sanityChecks,
    updateInput,
    saveDeal,
    isDirty,
    savedDeals,
  } = useDeal();

  const [viewMode, setViewMode] = useState<ViewMode>('inputs');
  const [showDealManager, setShowDealManager] = useState(false);
  const [showShareManager, setShowShareManager] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showZimasUpload, setShowZimasUpload] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Handle ZIMAS data extraction
  const handleZimasData = (data: Record<string, unknown>) => {
    Object.entries(data).forEach(([key, value]) => {
      if (key in inputs) {
        updateInput(key as keyof DealInputs, value as DealInputs[keyof DealInputs]);
      }
    });
    setShowZimasUpload(false);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const filename = `Land-Residual-${inputs.propertyAddress || 'Analysis'}-${new Date().toISOString().split('T')[0]}.pdf`;
      await exportToPDF('executive-summary', filename);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF export failed. Please try printing instead.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Land Residual Analysis
              </h1>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                LAAA Team
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick Results */}
              <div className="hidden md:flex items-center gap-4 mr-4 text-sm">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Primary Residual</p>
                  <p className={cn(
                    'font-bold',
                    calculations.primaryResidual >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatCurrency(calculations.primaryResidual, { compact: true })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Per Unit</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(calculations.primaryPerUnit, { compact: true })}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={() => setShowDealManager(true)}
                className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Deals
              </button>
              {savedDeals.length >= 2 && (
                <button
                  onClick={() => setShowComparison(true)}
                  className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Compare Deals"
                >
                  Compare
                </button>
              )}
              <button
                onClick={() => setShowShareManager(true)}
                className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Share Deal"
              >
                Share
              </button>
              <button
                onClick={() => saveDeal()}
                disabled={!isDirty}
                className={cn(
                  'px-3 py-2 text-sm rounded-lg transition-colors',
                  isDirty
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                )}
              >
                Save
              </button>
              <LogoutButton />
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex gap-1 mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
            <TabButton
              active={viewMode === 'inputs'}
              onClick={() => setViewMode('inputs')}
            >
              Inputs
            </TabButton>
            <TabButton
              active={viewMode === 'summary'}
              onClick={() => setViewMode('summary')}
            >
              Summary
            </TabButton>
            <TabButton
              active={viewMode === 'sensitivity'}
              onClick={() => setViewMode('sensitivity')}
            >
              Sensitivity
            </TabButton>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {viewMode === 'inputs' && (
          <div className="space-y-6">
            {/* ZIMAS Upload Section */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Import from ZIMAS</h3>
                  <p className="text-sm text-gray-500">Upload a ZIMAS Parcel Profile PDF to auto-fill property data</p>
                </div>
                <button
                  onClick={() => setShowZimasUpload(!showZimasUpload)}
                  className="px-4 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                >
                  {showZimasUpload ? 'Hide' : 'Upload ZIMAS'}
                </button>
              </div>
              {showZimasUpload && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <ZIMASUpload onDataExtracted={handleZimasData} />
                </div>
              )}
            </div>

            <DealForm
              inputs={inputs}
              onChange={updateInput}
              calculations={{
                totalSellableSF: calculations.totalSellableSF,
                grossBuildingSF: calculations.grossBuildingSF,
              }}
            />
          </div>
        )}

        {viewMode === 'summary' && (
          <div className="space-y-4">
            {/* Export Actions */}
            <div className="flex justify-end gap-2 print:hidden">
              <button
                onClick={printReport}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Print
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </button>
            </div>

            <ExecutiveSummary
              inputs={inputs}
              calculations={calculations}
              sanityChecks={sanityChecks}
            />
          </div>
        )}

        {viewMode === 'sensitivity' && (
          <SensitivityTables inputs={inputs} />
        )}
      </main>

      {/* Deal Manager Modal */}
      {showDealManager && (
        <DealManager onClose={() => setShowDealManager(false)} />
      )}

      {/* Share Manager Modal */}
      {showShareManager && inputs.id && (
        <ShareManager
          dealId={inputs.id}
          dealName={inputs.name || 'Untitled Deal'}
          inputs={inputs}
          onClose={() => setShowShareManager(false)}
        />
      )}

      {/* Deal Comparison Modal */}
      {showComparison && (
        <DealComparison
          savedDeals={savedDeals}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
        active
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      )}
    >
      {children}
    </button>
  );
}

export default function Home() {
  return (
    <PasswordGate>
      <DealProvider>
        <AppContent />
      </DealProvider>
    </PasswordGate>
  );
}
