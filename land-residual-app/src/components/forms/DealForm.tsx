'use client';

import React from 'react';
import { DealInputs, ZoningType, DensityBonusProgram, ConstructionType, ParkingType, ProductType, HighestBestUse, Jurisdiction, RentalExitStrategy, AffordableIncomeLevel, ParkFeeType, AHLFMarketArea, AHLFBasis } from '@/types/deal';
import { Section, FormGrid, Divider } from '@/components/ui/Section';
import {
  TextInput,
  NumberInput,
  CurrencyInput,
  PercentInput,
  SelectInput,
  ToggleInput,
  DisplayField,
} from '@/components/ui/FormField';

interface DealFormProps {
  inputs: DealInputs;
  onChange: (field: keyof DealInputs, value: DealInputs[keyof DealInputs]) => void;
  calculations?: {
    totalSellableSF: number;
    grossBuildingSF: number;
  };
}

const ZONING_OPTIONS: { value: ZoningType; label: string }[] = [
  { value: 'LAR3', label: 'LAR3' },
  { value: 'C2', label: 'C2' },
  { value: 'C1', label: 'C1' },
  { value: 'C4', label: 'C4' },
  { value: 'C5', label: 'C5' },
  { value: 'CM', label: 'CM' },
  { value: 'R1', label: 'R1' },
  { value: 'R2', label: 'R2' },
  { value: 'R3', label: 'R3' },
  { value: 'R4', label: 'R4' },
  { value: 'R5', label: 'R5' },
  { value: 'RD1.5', label: 'RD1.5' },
  { value: 'RD2', label: 'RD2' },
  { value: 'RD3', label: 'RD3' },
  { value: 'RD4', label: 'RD4' },
  { value: 'RD5', label: 'RD5' },
  { value: 'RD6', label: 'RD6' },
  { value: 'MR1', label: 'MR1' },
  { value: 'MR2', label: 'MR2' },
  { value: 'M1', label: 'M1' },
  { value: 'M2', label: 'M2' },
  { value: 'Other', label: 'Other' },
];

const DENSITY_BONUS_OPTIONS: { value: DensityBonusProgram; label: string }[] = [
  { value: 'None', label: 'None' },
  { value: 'TOC Tier 1', label: 'TOC Tier 1' },
  { value: 'TOC Tier 2', label: 'TOC Tier 2' },
  { value: 'TOC Tier 3', label: 'TOC Tier 3' },
  { value: 'TOC Tier 4', label: 'TOC Tier 4' },
  { value: 'DB', label: 'Density Bonus (DB)' },
  { value: 'ED1', label: 'ED1' },
  { value: 'IHO', label: 'IHO' },
];

const CONSTRUCTION_OPTIONS: { value: ConstructionType; label: string }[] = [
  { value: 'Type V Wood-Frame', label: 'Type V Wood-Frame' },
  { value: 'Type III Podium', label: 'Type III Podium' },
  { value: 'Type I Concrete', label: 'Type I Concrete' },
];

const PARKING_OPTIONS: { value: ParkingType; label: string }[] = [
  { value: 'None', label: 'None' },
  { value: 'Surface', label: 'Surface' },
  { value: 'Tuck-Under', label: 'Tuck-Under' },
  { value: 'Subterranean', label: 'Subterranean' },
];

const PRODUCT_OPTIONS: { value: ProductType; label: string }[] = [
  { value: 'For-Sale Condos', label: 'For-Sale Condos' },
  { value: 'Rental', label: 'Rental' },
  { value: 'Both', label: 'Both' },
];

const HBU_OPTIONS: { value: HighestBestUse; label: string }[] = [
  { value: 'Either', label: 'Either (Auto-Select)' },
  { value: 'Condo', label: 'Condo' },
  { value: 'Rental', label: 'Rental' },
];

const JURISDICTION_OPTIONS: { value: Jurisdiction; label: string }[] = [
  { value: 'City of Los Angeles', label: 'City of Los Angeles' },
  { value: 'Unincorporated LA County', label: 'Unincorporated LA County' },
  { value: 'Other', label: 'Other' },
];

const EXIT_STRATEGY_OPTIONS: { value: RentalExitStrategy; label: string }[] = [
  { value: 'Sell Stabilized', label: 'Sell Stabilized' },
  { value: 'Refi & Hold', label: 'Refi & Hold' },
];

const AFFORDABLE_LEVEL_OPTIONS: { value: AffordableIncomeLevel; label: string }[] = [
  { value: 'Extremely Low (30% AMI)', label: 'Extremely Low (30% AMI)' },
  { value: 'Very Low (50% AMI)', label: 'Very Low (50% AMI)' },
  { value: 'Low (80% AMI)', label: 'Low (80% AMI)' },
  { value: 'Moderate (120% AMI)', label: 'Moderate (120% AMI)' },
];

const PARK_FEE_OPTIONS: { value: ParkFeeType; label: string }[] = [
  { value: 'Non-Subdivision', label: 'Non-Subdivision ($8,805/unit)' },
  { value: 'Subdivision', label: 'Subdivision ($17,964/unit)' },
];

const AHLF_AREA_OPTIONS: { value: AHLFMarketArea; label: string }[] = [
  { value: 'Low', label: 'Low ($10.32/SF)' },
  { value: 'Medium', label: 'Medium ($12.91/SF)' },
  { value: 'Medium-High', label: 'Medium-High ($16.77/SF)' },
  { value: 'High', label: 'High ($23.20/SF)' },
];

const AHLF_BASIS_OPTIONS: { value: AHLFBasis; label: string }[] = [
  { value: 'Sellable SF', label: 'Sellable SF' },
  { value: 'Gross Building SF', label: 'Gross Building SF' },
];

export function DealForm({ inputs, onChange, calculations }: DealFormProps) {
  const handleChange = <K extends keyof DealInputs>(field: K) => (value: DealInputs[K]) => {
    onChange(field, value);
  };

  return (
    <div className="space-y-4">
      {/* Section A: Site & Project Description */}
      <Section title="A. Site & Project Description" subtitle="Basic property and project information">
        <FormGrid cols={3}>
          <TextInput
            label="Property Address"
            value={inputs.propertyAddress}
            onChange={handleChange('propertyAddress')}
            placeholder="123 Main St, Los Angeles, CA"
          />
          <TextInput
            label="APN"
            value={inputs.apn}
            onChange={handleChange('apn')}
            placeholder="5555-012-001"
            tooltip="Assessor Parcel Number"
          />
          <SelectInput
            label="Zoning"
            value={inputs.zoning}
            onChange={handleChange('zoning')}
            options={ZONING_OPTIONS}
          />
          <SelectInput
            label="Density Bonus Program"
            value={inputs.densityBonusProgram}
            onChange={handleChange('densityBonusProgram')}
            options={DENSITY_BONUS_OPTIONS}
            tooltip="TOC = Transit Oriented Communities"
          />
          <NumberInput
            label="Lot Size"
            value={inputs.lotSize}
            onChange={handleChange('lotSize')}
            suffix="SF"
            tooltip="Total lot square footage"
          />
          <NumberInput
            label="Number of Units"
            value={inputs.units}
            onChange={handleChange('units')}
            tooltip="Total units after density bonus"
          />
          <NumberInput
            label="Average Unit Size"
            value={inputs.avgUnitSF}
            onChange={handleChange('avgUnitSF')}
            suffix="SF"
            tooltip="Net sellable/rentable square feet per unit"
          />
          <PercentInput
            label="Common Area Factor"
            value={inputs.commonAreaFactor}
            onChange={handleChange('commonAreaFactor')}
            tooltip="Typically 12-18% for multifamily"
          />
          <NumberInput
            label="Stories"
            value={inputs.stories}
            onChange={handleChange('stories')}
          />
          <SelectInput
            label="Construction Type"
            value={inputs.constructionType}
            onChange={handleChange('constructionType')}
            options={CONSTRUCTION_OPTIONS}
          />
          <SelectInput
            label="Parking Type"
            value={inputs.parkingType}
            onChange={handleChange('parkingType')}
            options={PARKING_OPTIONS}
          />
          <NumberInput
            label="Parking Spaces (Base)"
            value={inputs.parkingSpacesBase}
            onChange={handleChange('parkingSpacesBase')}
            tooltip="Base parking requirement"
          />
          <NumberInput
            label="Parking Override"
            value={inputs.parkingSpacesOverride ?? 0}
            onChange={(v) => onChange('parkingSpacesOverride', v || null)}
            tooltip="Leave 0 to use base parking"
          />
          <ToggleInput
            label="Parking Incentives Used"
            checked={inputs.parkingIncentivesUsed}
            onChange={handleChange('parkingIncentivesUsed')}
          />
          <SelectInput
            label="Product Type"
            value={inputs.productType}
            onChange={handleChange('productType')}
            options={PRODUCT_OPTIONS}
          />
          <SelectInput
            label="Highest & Best Use"
            value={inputs.hbu}
            onChange={handleChange('hbu')}
            options={HBU_OPTIONS}
            tooltip="Determines primary residual method"
          />
        </FormGrid>

        {calculations && (
          <>
            <Divider label="Calculated Values" />
            <FormGrid cols={3}>
              <DisplayField
                label="Total Sellable SF"
                value={calculations.totalSellableSF}
                format="number"
              />
              <DisplayField
                label="Gross Building SF"
                value={calculations.grossBuildingSF}
                format="number"
              />
            </FormGrid>
          </>
        )}
      </Section>

      {/* Jurisdiction & Taxes */}
      <Section title="Jurisdiction & Taxes" subtitle="Tax jurisdictions and Measure ULA settings">
        <FormGrid cols={3}>
          <SelectInput
            label="Jurisdiction"
            value={inputs.jurisdiction}
            onChange={handleChange('jurisdiction')}
            options={JURISDICTION_OPTIONS}
          />
          <ToggleInput
            label="Apply Measure ULA"
            checked={inputs.applyULA}
            onChange={handleChange('applyULA')}
            tooltip="Mansion Tax for City of LA sales >$5M"
          />
        </FormGrid>
        {inputs.applyULA && (
          <FormGrid cols={4} className="mt-4">
            <CurrencyInput
              label="ULA Tier 1 Threshold"
              value={inputs.ulaT1Threshold}
              onChange={handleChange('ulaT1Threshold')}
            />
            <CurrencyInput
              label="ULA Tier 2 Threshold"
              value={inputs.ulaT2Threshold}
              onChange={handleChange('ulaT2Threshold')}
            />
            <PercentInput
              label="ULA Tier 1 Rate"
              value={inputs.ulaT1Rate}
              onChange={handleChange('ulaT1Rate')}
            />
            <PercentInput
              label="ULA Tier 2 Rate"
              value={inputs.ulaT2Rate}
              onChange={handleChange('ulaT2Rate')}
            />
          </FormGrid>
        )}
      </Section>

      {/* Section B: Revenue - For Sale */}
      <Section title="B. Revenue Assumptions - For-Sale" subtitle="Condo sales pricing and costs" defaultOpen={inputs.productType !== 'Rental'}>
        <FormGrid cols={4}>
          <CurrencyInput
            label="Sale Price / SF"
            value={inputs.salePricePSF}
            onChange={handleChange('salePricePSF')}
            tooltip="Blended sale price per sellable SF"
          />
          <PercentInput
            label="Broker Commission"
            value={inputs.brokerCommission}
            onChange={handleChange('brokerCommission')}
          />
          <PercentInput
            label="Transfer Tax & Closing"
            value={inputs.transferTaxClosing}
            onChange={handleChange('transferTaxClosing')}
          />
          <PercentInput
            label="Marketing & Sales"
            value={inputs.marketingSales}
            onChange={handleChange('marketingSales')}
          />
        </FormGrid>
      </Section>

      {/* Section C: Revenue - Rental */}
      <Section title="C. Revenue Assumptions - Rental" subtitle="Rental income projections" defaultOpen={inputs.productType !== 'For-Sale Condos'}>
        <FormGrid cols={4}>
          <PercentInput
            label="% of Units Affordable"
            value={inputs.affordablePct}
            onChange={handleChange('affordablePct')}
            tooltip="Percentage of total units with income restrictions"
          />
          <SelectInput
            label="Affordable Income Level"
            value={inputs.affordableLevel}
            onChange={handleChange('affordableLevel')}
            options={AFFORDABLE_LEVEL_OPTIONS}
          />
          <CurrencyInput
            label="LA County AMI (2-Person)"
            value={inputs.ami}
            onChange={handleChange('ami')}
            tooltip="Area Median Income for 2-person household"
          />
          <CurrencyInput
            label="Utility Allowance"
            value={inputs.utilityAllowance}
            onChange={handleChange('utilityAllowance')}
            tooltip="Monthly utility allowance deducted from affordable rent"
          />
          <NumberInput
            label="Market Rent / SF / Mo"
            value={inputs.marketRentPSF}
            onChange={handleChange('marketRentPSF')}
            prefix="$"
            decimals={2}
            tooltip="Monthly rent per square foot for market units"
          />
          <PercentInput
            label="Other Income (% of GPR)"
            value={inputs.otherIncome}
            onChange={handleChange('otherIncome')}
            tooltip="Parking, laundry, fees, etc."
          />
          <PercentInput
            label="Physical Vacancy"
            value={inputs.vacancy}
            onChange={handleChange('vacancy')}
          />
          <PercentInput
            label="Concessions / Credit Loss"
            value={inputs.concessions}
            onChange={handleChange('concessions')}
          />
        </FormGrid>

        <Divider label="Rental Exit Assumptions" />
        <FormGrid cols={3}>
          <SelectInput
            label="Exit Strategy"
            value={inputs.rentalExitStrategy}
            onChange={handleChange('rentalExitStrategy')}
            options={EXIT_STRATEGY_OPTIONS}
          />
          <PercentInput
            label="Disposition Brokerage"
            value={inputs.dispositionBrokerage}
            onChange={handleChange('dispositionBrokerage')}
          />
          <PercentInput
            label="Legal & Closing"
            value={inputs.rentalLegalClosing}
            onChange={handleChange('rentalLegalClosing')}
          />
        </FormGrid>
      </Section>

      {/* Section D: Operating Expenses */}
      <Section title="D. Operating Expenses - Rental" subtitle="Annual operating cost assumptions" defaultOpen={inputs.productType !== 'For-Sale Condos'}>
        <FormGrid cols={4}>
          <PercentInput
            label="Property Management"
            value={inputs.propertyManagement}
            onChange={handleChange('propertyManagement')}
            tooltip="% of EGI"
          />
          <CurrencyInput
            label="Insurance (per unit/yr)"
            value={inputs.insurancePerUnit}
            onChange={handleChange('insurancePerUnit')}
          />
          <PercentInput
            label="Property Tax Rate"
            value={inputs.propertyTaxRate}
            onChange={handleChange('propertyTaxRate')}
            decimals={2}
          />
          <CurrencyInput
            label="Repairs & Maint (per unit/yr)"
            value={inputs.repairsMaintenancePerUnit}
            onChange={handleChange('repairsMaintenancePerUnit')}
          />
          <CurrencyInput
            label="Utilities - Common (per unit/yr)"
            value={inputs.utilitiesCommonPerUnit}
            onChange={handleChange('utilitiesCommonPerUnit')}
          />
          <CurrencyInput
            label="Turnover (per unit/yr)"
            value={inputs.turnoverPerUnit}
            onChange={handleChange('turnoverPerUnit')}
          />
          <CurrencyInput
            label="G&A (per unit/yr)"
            value={inputs.generalAdminPerUnit}
            onChange={handleChange('generalAdminPerUnit')}
          />
          <CurrencyInput
            label="Reserves (per unit/yr)"
            value={inputs.reservesPerUnit}
            onChange={handleChange('reservesPerUnit')}
          />
        </FormGrid>
      </Section>

      {/* Section E: Construction & Development Costs */}
      <Section title="E. Construction & Development Costs" subtitle="Hard costs, soft costs, and fees">
        <Divider label="Hard Costs" />
        <FormGrid cols={4}>
          <CurrencyInput
            label="Base Building Cost / SF"
            value={inputs.baseBuildingCostPSF}
            onChange={handleChange('baseBuildingCostPSF')}
            tooltip="Per gross building SF"
          />
          <CurrencyInput
            label="Parking Cost / Space"
            value={inputs.parkingCostPerSpace}
            onChange={handleChange('parkingCostPerSpace')}
            tooltip="For subterranean; tuck-under ~$32K, surface ~$10K"
          />
          <CurrencyInput
            label="Demo & Abatement"
            value={inputs.demolitionAbatement}
            onChange={handleChange('demolitionAbatement')}
          />
          <CurrencyInput
            label="Grading & Utilities"
            value={inputs.gradingUtilities}
            onChange={handleChange('gradingUtilities')}
          />
          <CurrencyInput
            label="Landscaping & Hardscape"
            value={inputs.landscapingHardscape}
            onChange={handleChange('landscapingHardscape')}
          />
          <PercentInput
            label="Hard Cost Contingency"
            value={inputs.hardCostContingency}
            onChange={handleChange('hardCostContingency')}
          />
        </FormGrid>

        <Divider label="Soft Costs & City Fees" />
        <FormGrid cols={4}>
          <PercentInput
            label="Architecture & Engineering"
            value={inputs.architectureEngineering}
            onChange={handleChange('architectureEngineering')}
            tooltip="% of hard costs"
          />
          <CurrencyInput
            label="Surveys, Geotech, Env"
            value={inputs.surveysGeotechEnv}
            onChange={handleChange('surveysGeotechEnv')}
          />
          <CurrencyInput
            label="Legal & Accounting"
            value={inputs.legalAccounting}
            onChange={handleChange('legalAccounting')}
          />
          <PercentInput
            label="LADBS Permit Fee Rate"
            value={inputs.ladbsPermitFeeRate}
            onChange={handleChange('ladbsPermitFeeRate')}
            tooltip="% of hard costs"
          />
          <PercentInput
            label="Plan Check (% of Permit)"
            value={inputs.planCheckPct}
            onChange={handleChange('planCheckPct')}
          />
          <CurrencyInput
            label="LAUSD School Fees / SF"
            value={inputs.lausdSchoolFeesPSF}
            onChange={handleChange('lausdSchoolFeesPSF')}
            tooltip="2025 rate: $5.17/SF"
          />
        </FormGrid>

        <Divider label="Park Fees & AHLF" />
        <FormGrid cols={3}>
          <ToggleInput
            label="Park Fee Applies"
            checked={inputs.parkFeeApplies}
            onChange={handleChange('parkFeeApplies')}
          />
          {inputs.parkFeeApplies && (
            <SelectInput
              label="Park Fee Type"
              value={inputs.parkFeeType}
              onChange={handleChange('parkFeeType')}
              options={PARK_FEE_OPTIONS}
            />
          )}
        </FormGrid>
        <FormGrid cols={3} className="mt-4">
          <ToggleInput
            label="AHLF Applies"
            checked={inputs.ahlfApplies}
            onChange={handleChange('ahlfApplies')}
            tooltip="Affordable Housing Linkage Fee"
          />
          {inputs.ahlfApplies && (
            <>
              <SelectInput
                label="AHLF Market Area"
                value={inputs.ahlfMarketArea}
                onChange={handleChange('ahlfMarketArea')}
                options={AHLF_AREA_OPTIONS}
              />
              <SelectInput
                label="AHLF Basis"
                value={inputs.ahlfBasis}
                onChange={handleChange('ahlfBasis')}
                options={AHLF_BASIS_OPTIONS}
              />
            </>
          )}
        </FormGrid>

        <Divider label="Other Soft Costs" />
        <FormGrid cols={4}>
          <PercentInput
            label="Cultural Affairs / Art Fee"
            value={inputs.culturalArtsFeePct}
            onChange={handleChange('culturalArtsFeePct')}
            tooltip="% of hard costs"
          />
          <CurrencyInput
            label="Affordable In-Lieu (Other)"
            value={inputs.affordableHousingInLieu}
            onChange={handleChange('affordableHousingInLieu')}
          />
          <CurrencyInput
            label="Fire / LAFD / Green"
            value={inputs.fireLAFDGreen}
            onChange={handleChange('fireLAFDGreen')}
          />
          <CurrencyInput
            label="DWP / Sewer Connections"
            value={inputs.dwpSewerConnections}
            onChange={handleChange('dwpSewerConnections')}
          />
          <PercentInput
            label="Builder's Risk Insurance"
            value={inputs.buildersRiskInsurance}
            onChange={handleChange('buildersRiskInsurance')}
            tooltip="% of hard costs"
          />
          <PercentInput
            label="Wrap/GL Insurance (Condo)"
            value={inputs.wrapGLInsuranceCondo}
            onChange={handleChange('wrapGLInsuranceCondo')}
            tooltip="For-sale only; % of hard costs"
          />
          <PercentInput
            label="Soft Cost Contingency"
            value={inputs.softCostContingency}
            onChange={handleChange('softCostContingency')}
          />
        </FormGrid>

        <Divider label="Financing & Carry" />
        <FormGrid cols={4}>
          <PercentInput
            label="Construction Loan LTC"
            value={inputs.constructionLoanLTC}
            onChange={handleChange('constructionLoanLTC')}
            tooltip="Loan-to-Cost ratio"
          />
          <PercentInput
            label="Interest Rate (Annual)"
            value={inputs.interestRate}
            onChange={handleChange('interestRate')}
          />
          <PercentInput
            label="Loan Origination Fee"
            value={inputs.loanOriginationFee}
            onChange={handleChange('loanOriginationFee')}
          />
          <NumberInput
            label="Construction Period"
            value={inputs.constructionMonths}
            onChange={handleChange('constructionMonths')}
            suffix="mo"
          />
          <NumberInput
            label="Sell-Out / Lease-Up"
            value={inputs.selloutLeaseUpMonths}
            onChange={handleChange('selloutLeaseUpMonths')}
            suffix="mo"
          />
          <PercentInput
            label="Avg Outstanding Balance"
            value={inputs.avgOutstandingBalanceFactor}
            onChange={handleChange('avgOutstandingBalanceFactor')}
            tooltip="Typically 50-60%"
          />
          <CurrencyInput
            label="Lease-Up Reserve (Rental)"
            value={inputs.leaseUpReserve}
            onChange={handleChange('leaseUpReserve')}
          />
        </FormGrid>
        <FormGrid cols={3} className="mt-4">
          <NumberInput
            label="Months to Permit"
            value={inputs.monthsToPermit}
            onChange={handleChange('monthsToPermit')}
            suffix="mo"
            tooltip="Pre-construction land carry period"
          />
          <PercentInput
            label="Land Carry Interest Rate"
            value={inputs.landCarryInterestRate}
            onChange={handleChange('landCarryInterestRate')}
          />
          <CurrencyInput
            label="Land Carry Base Value"
            value={inputs.landCarryBaseValue}
            onChange={handleChange('landCarryBaseValue')}
            tooltip="Land value for carry calculation"
          />
        </FormGrid>
      </Section>

      {/* Section F: Return Targets */}
      <Section title="F. Return Targets" subtitle="Developer profit and return requirements">
        <FormGrid cols={4}>
          <PercentInput
            label="Condo Profit Margin"
            value={inputs.condoProfitMargin}
            onChange={handleChange('condoProfitMargin')}
            tooltip="% of gross revenue"
          />
          <PercentInput
            label="Yield-on-Cost Target"
            value={inputs.yocTarget}
            onChange={handleChange('yocTarget')}
            tooltip="NOI / Total Project Cost"
          />
          <PercentInput
            label="Dev Profit Margin Target"
            value={inputs.devProfitMarginTarget}
            onChange={handleChange('devProfitMarginTarget')}
            tooltip="% of stabilized value"
          />
          <NumberInput
            label="Target Equity Multiple"
            value={inputs.targetEquityMultiple}
            onChange={handleChange('targetEquityMultiple')}
            suffix="x"
            decimals={2}
          />
          <PercentInput
            label="Equity % of Total Cost"
            value={inputs.equityPctOfTotalCost}
            onChange={handleChange('equityPctOfTotalCost')}
          />
          <PercentInput
            label="Target Levered IRR"
            value={inputs.targetLeveredIRR}
            onChange={handleChange('targetLeveredIRR')}
          />
          <PercentInput
            label="Unlevered ROC Target"
            value={inputs.unleveredROCTarget}
            onChange={handleChange('unleveredROCTarget')}
          />
          <PercentInput
            label="Exit Cap Rate"
            value={inputs.exitCapRate}
            onChange={handleChange('exitCapRate')}
          />
        </FormGrid>
      </Section>
    </div>
  );
}
