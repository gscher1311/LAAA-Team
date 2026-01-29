'use client';

import React, { useState } from 'react';
import { DealProvider, useDeal } from '@/context/DealContext';
import { PasswordGate, LogoutButton } from '@/components/auth/PasswordGate';
import { DealForm } from '@/components/forms/DealForm';
import { ExecutiveSummary } from '@/components/outputs/ExecutiveSummary';
import { SensitivityTables } from '@/components/outputs/SensitivityTables';
import { DealManager } from '@/components/DealManager';
import { exportToPDF, printReport } from '@/lib/pdfExport';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

type ViewMode = 'inputs' | 'summary' | 'sensitivity';

function AppContent() {
  const {
    inputs,
    calculations,
    sanityChecks,
    updateInput,
    saveDeal,
    isDirty,
  } = useDeal();

  const [viewMode, setViewMode] = useState<ViewMode>('inputs');
  const [showDealManager, setShowDealManager] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
          <DealForm
            inputs={inputs}
            onChange={updateInput}
            calculations={{
              totalSellableSF: calculations.totalSellableSF,
              grossBuildingSF: calculations.grossBuildingSF,
            }}
          />
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
