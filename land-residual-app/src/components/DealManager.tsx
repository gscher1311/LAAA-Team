'use client';

import React, { useState } from 'react';
import { useDeal } from '@/context/DealContext';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface DealManagerProps {
  onClose: () => void;
}

export function DealManager({ onClose }: DealManagerProps) {
  const {
    savedDeals,
    currentDealId,
    loadDeal,
    deleteDeal,
    duplicateDeal,
    newDeal,
    isDirty,
    saveDeal,
    inputs,
  } = useDeal();

  const [dealName, setDealName] = useState(inputs.name);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleSave = () => {
    saveDeal(dealName);
    setShowSaveDialog(false);
  };

  const handleLoad = (id: string) => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Load anyway?')) {
        loadDeal(id);
        onClose();
      }
    } else {
      loadDeal(id);
      onClose();
    }
  };

  const handleNew = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Start new anyway?')) {
        newDeal();
        onClose();
      }
    } else {
      newDeal();
      onClose();
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this deal?')) {
      deleteDeal(id);
    }
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateDeal(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Deal Manager
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Save Dialog */}
        {showSaveDialog ? (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Deal Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={dealName}
                onChange={(e) => setDealName(e.target.value)}
                placeholder="Enter deal name..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                autoFocus
              />
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex gap-2">
            <button
              onClick={handleNew}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium"
            >
              + New Deal
            </button>
            <button
              onClick={() => {
                setDealName(inputs.name);
                setShowSaveDialog(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Save Current
            </button>
          </div>
        )}

        {/* Deal List */}
        <div className="flex-1 overflow-y-auto p-4">
          {savedDeals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No saved deals yet</p>
              <p className="text-sm">Save your first analysis to see it here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedDeals
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .map((deal) => (
                  <button
                    key={deal.id}
                    onClick={() => handleLoad(deal.id)}
                    className={cn(
                      'w-full text-left p-4 rounded-lg border transition-colors',
                      deal.id === currentDealId
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {deal.name}
                          </h3>
                          {deal.id === currentDealId && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                          {deal.inputs.propertyAddress || 'No address'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Updated: {formatDate(deal.updatedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <button
                          onClick={(e) => handleDuplicate(deal.id, e)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Duplicate"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => handleDelete(deal.id, e)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
