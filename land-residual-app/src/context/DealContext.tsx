'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DealInputs, DealCalculations, SanityCheck, DEFAULT_INPUTS } from '@/types/deal';
import { calculateDeal, generateSanityChecks } from '@/lib/calculations';
import { getFromStorage, setToStorage, generateId } from '@/lib/utils';

interface SavedDeal {
  id: string;
  name: string;
  inputs: DealInputs;
  createdAt: string;
  updatedAt: string;
}

interface DealContextType {
  // Current deal state
  inputs: DealInputs;
  calculations: DealCalculations;
  sanityChecks: SanityCheck[];

  // Actions
  updateInput: <K extends keyof DealInputs>(field: K, value: DealInputs[K]) => void;
  resetToDefaults: () => void;
  resetSection: (section: string) => void;

  // Deal management
  savedDeals: SavedDeal[];
  currentDealId: string | null;
  saveDeal: (name?: string) => void;
  loadDeal: (id: string) => void;
  deleteDeal: (id: string) => void;
  duplicateDeal: (id: string) => void;
  newDeal: () => void;

  // UI state
  isDirty: boolean;
}

const DealContext = createContext<DealContextType | null>(null);

const DEALS_STORAGE_KEY = 'laaa_saved_deals';
const CURRENT_DEAL_KEY = 'laaa_current_deal';

export function DealProvider({ children }: { children: React.ReactNode }) {
  // Initialize with default inputs
  const [inputs, setInputs] = useState<DealInputs>(() => {
    const newId = generateId();
    return {
      ...DEFAULT_INPUTS,
      id: newId,
      name: 'New Analysis',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const [savedDeals, setSavedDeals] = useState<SavedDeal[]>([]);
  const [currentDealId, setCurrentDealId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Calculate derived values
  const calculations = calculateDeal(inputs);
  const sanityChecks = generateSanityChecks(inputs, calculations);

  // Load saved deals from localStorage on mount - hydration pattern
  useEffect(() => {
    const saved = getFromStorage<SavedDeal[]>(DEALS_STORAGE_KEY, []);
    setSavedDeals(saved);

    // Load current deal if it exists
    const currentId = getFromStorage<string | null>(CURRENT_DEAL_KEY, null);
    if (currentId) {
      const deal = saved.find((d) => d.id === currentId);
      if (deal) {
        setInputs(deal.inputs);
        setCurrentDealId(currentId);
      }
    }

    setIsHydrated(true);
  }, []);

  // Save deals to localStorage when they change
  useEffect(() => {
    if (isHydrated) {
      setToStorage(DEALS_STORAGE_KEY, savedDeals);
    }
  }, [savedDeals, isHydrated]);

  // Save current deal ID to localStorage
  useEffect(() => {
    if (isHydrated) {
      setToStorage(CURRENT_DEAL_KEY, currentDealId);
    }
  }, [currentDealId, isHydrated]);

  // Update a single input field
  const updateInput = useCallback(<K extends keyof DealInputs>(
    field: K,
    value: DealInputs[K]
  ) => {
    setInputs((prev) => ({
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString(),
    }));
    setIsDirty(true);
  }, []);

  // Reset all inputs to defaults
  const resetToDefaults = useCallback(() => {
    const newId = generateId();
    setInputs({
      ...DEFAULT_INPUTS,
      id: newId,
      name: 'New Analysis',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setCurrentDealId(null);
    setIsDirty(false);
  }, []);

  // Reset specific section to defaults
  const resetSection = useCallback((section: string) => {
    const sectionDefaults: Partial<Record<string, (keyof typeof DEFAULT_INPUTS)[]>> = {
      site: ['lotSize', 'units', 'avgUnitSF', 'commonAreaFactor', 'stories', 'constructionType', 'parkingType', 'parkingSpacesBase'],
      revenue: ['salePricePSF', 'brokerCommission', 'transferTaxClosing', 'marketingSales'],
      rental: ['affordablePct', 'affordableLevel', 'ami', 'utilityAllowance', 'marketRentPSF', 'otherIncome', 'vacancy', 'concessions'],
      opex: ['propertyManagement', 'insurancePerUnit', 'propertyTaxRate', 'repairsMaintenancePerUnit', 'utilitiesCommonPerUnit', 'turnoverPerUnit', 'generalAdminPerUnit', 'reservesPerUnit'],
      costs: ['baseBuildingCostPSF', 'parkingCostPerSpace', 'demolitionAbatement', 'gradingUtilities', 'landscapingHardscape', 'hardCostContingency'],
      targets: ['condoProfitMargin', 'yocTarget', 'devProfitMarginTarget', 'targetEquityMultiple', 'equityPctOfTotalCost', 'targetLeveredIRR', 'unleveredROCTarget', 'exitCapRate'],
    };

    const fieldsToReset = sectionDefaults[section];
    if (fieldsToReset) {
      setInputs((prev) => {
        const updates: Partial<DealInputs> = {};
        fieldsToReset.forEach((field) => {
          (updates as Record<string, unknown>)[field] = DEFAULT_INPUTS[field];
        });
        return {
          ...prev,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      });
      setIsDirty(true);
    }
  }, []);

  // Save current deal
  const saveDeal = useCallback((name?: string) => {
    const dealName = name || inputs.name || `Analysis ${new Date().toLocaleDateString()}`;
    const now = new Date().toISOString();

    const updatedInputs = {
      ...inputs,
      name: dealName,
      updatedAt: now,
    };

    setInputs(updatedInputs);

    const dealToSave: SavedDeal = {
      id: inputs.id,
      name: dealName,
      inputs: updatedInputs,
      createdAt: inputs.createdAt,
      updatedAt: now,
    };

    setSavedDeals((prev) => {
      const existingIndex = prev.findIndex((d) => d.id === inputs.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = dealToSave;
        return updated;
      }
      return [...prev, dealToSave];
    });

    setCurrentDealId(inputs.id);
    setIsDirty(false);
  }, [inputs]);

  // Load a saved deal
  const loadDeal = useCallback((id: string) => {
    const deal = savedDeals.find((d) => d.id === id);
    if (deal) {
      setInputs(deal.inputs);
      setCurrentDealId(id);
      setIsDirty(false);
    }
  }, [savedDeals]);

  // Delete a saved deal
  const deleteDeal = useCallback((id: string) => {
    setSavedDeals((prev) => prev.filter((d) => d.id !== id));
    if (currentDealId === id) {
      resetToDefaults();
    }
  }, [currentDealId, resetToDefaults]);

  // Duplicate a deal
  const duplicateDeal = useCallback((id: string) => {
    const deal = savedDeals.find((d) => d.id === id);
    if (deal) {
      const newId = generateId();
      const now = new Date().toISOString();
      const newInputs: DealInputs = {
        ...deal.inputs,
        id: newId,
        name: `${deal.name} (Copy)`,
        createdAt: now,
        updatedAt: now,
      };
      setInputs(newInputs);
      setCurrentDealId(null);
      setIsDirty(true);
    }
  }, [savedDeals]);

  // Start a new deal
  const newDeal = useCallback(() => {
    resetToDefaults();
  }, [resetToDefaults]);

  return (
    <DealContext.Provider
      value={{
        inputs,
        calculations,
        sanityChecks,
        updateInput,
        resetToDefaults,
        resetSection,
        savedDeals,
        currentDealId,
        saveDeal,
        loadDeal,
        deleteDeal,
        duplicateDeal,
        newDeal,
        isDirty,
      }}
    >
      {children}
    </DealContext.Provider>
  );
}

export function useDeal() {
  const context = useContext(DealContext);
  if (!context) {
    throw new Error('useDeal must be used within a DealProvider');
  }
  return context;
}
