'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn, formatDate } from '@/lib/utils';
import { DealInputs } from '@/types/deal';

interface Share {
  id: string;
  token: string;
  url: string;
  type: 'summary' | 'full';
  client_email: string | null;
  client_name: string | null;
  expires_at: string | null;
  created_at: string;
  view_count: number;
  last_viewed: string | null;
  is_active: boolean;
}

interface ShareManagerProps {
  dealId: string;
  dealName: string;
  inputs: DealInputs;
  onClose: () => void;
}

export function ShareManager({ dealId, dealName, inputs, onClose }: ShareManagerProps) {
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Create form state
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [shareType, setShareType] = useState<'summary' | 'full'>('summary');
  const [expiresInDays, setExpiresInDays] = useState<number | ''>('');

  // Sync deal to database
  const syncDealToDb = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: dealId,
          name: dealName,
          inputs,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync deal');
      }

      return true;
    } catch (error) {
      console.error('Failed to sync deal:', error);
      setSyncError('Failed to save deal to server. Please try again.');
      return false;
    } finally {
      setSyncing(false);
    }
  }, [dealId, dealName, inputs]);

  const loadShares = useCallback(async () => {
    try {
      const response = await fetch(`/api/shares?dealId=${dealId}`);
      const data = await response.json();
      if (data.shares) {
        setShares(data.shares);
      }
    } catch (error) {
      console.error('Failed to load shares:', error);
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  // Sync deal and load shares on mount
  useEffect(() => {
    async function init() {
      await syncDealToDb();
      await loadShares();
    }
    init();
  }, [syncDealToDb, loadShares]);

  const handleCreate = async () => {
    setCreating(true);
    setSyncError(null);
    try {
      // Sync deal first to ensure it's in DB
      const synced = await syncDealToDb();
      if (!synced) {
        setCreating(false);
        return;
      }

      const response = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          shareType,
          clientName: clientName || undefined,
          clientEmail: clientEmail || undefined,
          expiresInDays: expiresInDays || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadShares();
        setShowCreateForm(false);
        setClientName('');
        setClientEmail('');
        setExpiresInDays('');
      } else {
        setSyncError(data.error || 'Failed to create share link');
      }
    } catch (error) {
      console.error('Failed to create share:', error);
      setSyncError('Failed to create share link. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (shareId: string) => {
    if (!confirm('Are you sure you want to deactivate this share link?')) return;

    try {
      await fetch(`/api/shares?id=${shareId}`, { method: 'DELETE' });
      await loadShares();
    } catch (error) {
      console.error('Failed to deactivate share:', error);
    }
  };

  const copyToClipboard = async (url: string, shareId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(shareId);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Share Deal
            </h2>
            <p className="text-sm text-gray-500">{dealName}</p>
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

        {/* Sync Status */}
        {syncing && (
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
            <p className="text-sm text-blue-700 dark:text-blue-300">Syncing deal to server...</p>
          </div>
        )}

        {syncError && (
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{syncError}</p>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm ? (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Create New Share Link</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Client Name (optional)
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Client Email (optional)
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Share Type
                  </label>
                  <select
                    value={shareType}
                    onChange={(e) => setShareType(e.target.value as 'summary' | 'full')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="summary">Summary Only</option>
                    <option value="full">Full Access</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expires In (days, optional)
                  </label>
                  <input
                    type="number"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Never"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 text-sm font-medium"
                >
                  {creating ? 'Creating...' : 'Create Link'}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              + Create Share Link
            </button>
          </div>
        )}

        {/* Share List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : shares.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No share links yet</p>
              <p className="text-sm">Create a share link to send to clients</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className={cn(
                    'p-4 rounded-lg border',
                    share.is_active
                      ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          share.type === 'summary'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        }`}>
                          {share.type === 'summary' ? 'Summary' : 'Full'}
                        </span>
                        {!share.is_active && (
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500">
                            Inactive
                          </span>
                        )}
                      </div>

                      {(share.client_name || share.client_email) && (
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {share.client_name || share.client_email}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={share.url}
                          readOnly
                          className="flex-1 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border-0 text-gray-600 dark:text-gray-400"
                        />
                        <button
                          onClick={() => copyToClipboard(share.url, share.id)}
                          className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          {copied === share.id ? 'Copied!' : 'Copy'}
                        </button>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Created: {formatDate(share.created_at)}</span>
                        {share.expires_at && (
                          <span>Expires: {formatDate(share.expires_at)}</span>
                        )}
                        <span>Views: {share.view_count}</span>
                      </div>
                    </div>

                    {share.is_active && (
                      <button
                        onClick={() => handleDeactivate(share.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors ml-2"
                        title="Deactivate"
                      >
                        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
