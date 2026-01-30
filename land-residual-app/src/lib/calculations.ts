// Land Residual Analysis Calculation Engine
import {
  DealInputs,
  DealCalculations,
  SanityCheck,
  Deal,
} from '@/types/deal';

// Helper function to get affordable income multiplier
function getAffordableIncomeMultiplier(level: string): number {
  switch (level) {
    case 'Extremely Low (30% AMI)': return 0.30;
    case 'Very Low (50% AMI)': return 0.50;
    case 'Low (80% AMI)': return 0.80;
    case 'Moderate (120% AMI)': return 1.20;
    default: return 0.30;
  }
}

// Helper function to get AHLF rate based on market area
function getAHLFRate(inputs: DealInputs): number {
  switch (inputs.ahlfMarketArea) {
    case 'Low': return inputs.ahlfLow;
    case 'Medium': return inputs.ahlfMedium;
    case 'Medium-High': return inputs.ahlfMediumHigh;
    case 'High': return inputs.ahlfHigh;
    default: return inputs.ahlfMedium;
  }
}

// Helper function to get parking cost per space by type
function getParkingCostPerSpace(inputs: DealInputs): number {
  if (inputs.parkingType === 'None') return 0;
  if (inputs.parkingType === 'Surface') return 10000;
  if (inputs.parkingType === 'Tuck-Under') return 32000;
  return inputs.parkingCostPerSpace; // Subterranean default
}

// Safe division helper to prevent division by zero
function safeDivide(numerator: number, denominator: number, fallback: number = 0): number {
  if (denominator === 0 || !isFinite(denominator)) return fallback;
  const result = numerator / denominator;
  return isFinite(result) ? result : fallback;
}

export function calculateDeal(inputs: DealInputs): DealCalculations {
  // ========== INPUT VALIDATION ==========
  // Ensure critical inputs have minimum values to prevent calculation errors
  const safeUnits = Math.max(inputs.units, 1);
  const safeLotSize = Math.max(inputs.lotSize, 1);
  const safeCommonAreaFactor = Math.min(inputs.commonAreaFactor, 0.99); // Prevent 100% common area
  const safeExitCapRate = Math.max(inputs.exitCapRate, 0.001); // Minimum 0.1%
  const safeYocTarget = Math.max(inputs.yocTarget, 0.001);
  const safeUnleveredROCTarget = Math.max(inputs.unleveredROCTarget, 0.001);

  // ========== BUILDING METRICS ==========
  const totalSellableSF = safeUnits * inputs.avgUnitSF;
  const grossBuildingSF = safeDivide(totalSellableSF, (1 - safeCommonAreaFactor), totalSellableSF);
  const effectiveParkingSpaces = inputs.parkingSpacesOverride ?? inputs.parkingSpacesBase;

  // ========== MODULE 1: COST STACK BUILD-UP ==========

  // Hard Costs
  const totalVerticalConstruction = inputs.baseBuildingCostPSF * grossBuildingSF;
  const parkingCostPerSpace = getParkingCostPerSpace(inputs);
  const totalParkingCost = parkingCostPerSpace * effectiveParkingSpaces;
  const totalSiteWork = inputs.demolitionAbatement + inputs.gradingUtilities + inputs.landscapingHardscape;

  const hardCostsBeforeContingency = totalVerticalConstruction + totalParkingCost + totalSiteWork;
  const hardCostContingencyAmount = hardCostsBeforeContingency * inputs.hardCostContingency;
  const totalHardCosts = hardCostsBeforeContingency + hardCostContingencyAmount;

  // Soft Costs
  const architectureEngineeringAmount = totalHardCosts * inputs.architectureEngineering;
  const permitFees = totalHardCosts * inputs.ladbsPermitFeeRate;
  const planCheckFees = permitFees * inputs.planCheckPct;
  const schoolFees = inputs.lausdSchoolFeesPSF * totalSellableSF;

  // Park Fees
  let parkFees = 0;
  if (inputs.parkFeeApplies) {
    parkFees = inputs.parkFeeType === 'Non-Subdivision'
      ? inputs.parkFeeNonSub * safeUnits
      : inputs.parkFeeSub * safeUnits;
  }

  // AHLF (Affordable Housing Linkage Fee)
  let ahlfFees = 0;
  if (inputs.ahlfApplies) {
    const ahlfRate = getAHLFRate(inputs);
    const ahlfBasisSF = inputs.ahlfBasis === 'Sellable SF' ? totalSellableSF : grossBuildingSF;
    ahlfFees = ahlfRate * ahlfBasisSF;
  }

  // Other Soft Costs
  const culturalArtsFee = totalHardCosts * inputs.culturalArtsFeePct;
  const buildersRiskAmount = totalHardCosts * inputs.buildersRiskInsurance;

  // Wrap/GL Insurance only for for-sale condos
  const wrapGLAmount = (inputs.productType === 'For-Sale Condos' || inputs.productType === 'Both')
    ? totalHardCosts * inputs.wrapGLInsuranceCondo
    : 0;

  const softCostsBeforeContingency =
    architectureEngineeringAmount +
    inputs.surveysGeotechEnv +
    inputs.legalAccounting +
    permitFees +
    planCheckFees +
    schoolFees +
    parkFees +
    ahlfFees +
    culturalArtsFee +
    inputs.affordableHousingInLieu +
    inputs.fireLAFDGreen +
    inputs.dwpSewerConnections +
    buildersRiskAmount +
    wrapGLAmount;

  const softCostContingencyAmount = softCostsBeforeContingency * inputs.softCostContingency;
  const totalSoftCosts = softCostsBeforeContingency + softCostContingencyAmount;

  // Financing & Carry
  const totalCostBeforeFinancing = totalHardCosts + totalSoftCosts;
  const constructionLoanAmount = totalCostBeforeFinancing * inputs.constructionLoanLTC;

  const interestReserveConstruction =
    constructionLoanAmount *
    inputs.interestRate *
    (inputs.constructionMonths / 12) *
    inputs.avgOutstandingBalanceFactor;

  const interestReserveSellout =
    constructionLoanAmount *
    inputs.interestRate *
    (inputs.selloutLeaseUpMonths / 12);

  const loanOrigination = constructionLoanAmount * inputs.loanOriginationFee;

  const landCarry =
    inputs.landCarryBaseValue *
    inputs.landCarryInterestRate *
    (inputs.monthsToPermit / 12);

  const totalFinancingCarry =
    interestReserveConstruction +
    interestReserveSellout +
    loanOrigination +
    landCarry +
    (inputs.productType === 'Rental' || inputs.productType === 'Both' ? inputs.leaseUpReserve : 0);

  // Total Development Cost (excluding land)
  const totalDevCostExLand = totalHardCosts + totalSoftCosts + totalFinancingCarry;

  // ========== MODULE 2: FOR-SALE CONDO RESIDUAL ==========
  // Note: Using safeUnits from input validation above
  const grossSalesRevenue = totalSellableSF * inputs.salePricePSF;
  const totalSellingCostsPct = inputs.brokerCommission + inputs.transferTaxClosing + inputs.marketingSales;
  const totalSellingCosts = grossSalesRevenue * totalSellingCostsPct;
  const netSalesRevenue = grossSalesRevenue - totalSellingCosts;
  const developerProfitCondo = grossSalesRevenue * inputs.condoProfitMargin;
  const residualLandCondo = netSalesRevenue - totalDevCostExLand - developerProfitCondo;

  // ========== MODULE 3: RENTAL NOI BUILD ==========
  const affordableUnits = Math.floor(safeUnits * inputs.affordablePct);
  const marketUnits = safeUnits - affordableUnits;

  // Affordable Rent Calculation
  const incomeMultiplier = getAffordableIncomeMultiplier(inputs.affordableLevel);
  const maxAffordableRent = (inputs.ami * incomeMultiplier / 12) * 0.30; // 30% of income
  const netAffordableRent = maxAffordableRent - inputs.utilityAllowance;

  // Market Rent
  const marketUnitRent = inputs.avgUnitSF * inputs.marketRentPSF;

  // Gross Potential Rent
  const gpr = (marketUnits * marketUnitRent * 12) + (affordableUnits * netAffordableRent * 12);

  // Other Income
  const otherIncomeAmount = gpr * inputs.otherIncome;

  // Gross Potential Income
  const gpi = gpr + otherIncomeAmount;

  // Effective Gross Income
  const egi = gpi * (1 - inputs.vacancy - inputs.concessions);

  // ========== MODULE 4: OPERATING EXPENSES ==========
  const managementExpense = egi * inputs.propertyManagement;
  const insuranceExpense = inputs.insurancePerUnit * safeUnits;
  const repairsMaintenanceExpense = inputs.repairsMaintenancePerUnit * safeUnits;
  const utilitiesExpense = inputs.utilitiesCommonPerUnit * safeUnits;
  const turnoverExpense = inputs.turnoverPerUnit * safeUnits;
  const generalAdminExpense = inputs.generalAdminPerUnit * safeUnits;
  const reservesExpense = inputs.reservesPerUnit * safeUnits;

  const totalOpExBeforeTax =
    managementExpense +
    insuranceExpense +
    repairsMaintenanceExpense +
    utilitiesExpense +
    turnoverExpense +
    generalAdminExpense +
    reservesExpense;

  const noiBeforeTax = egi - totalOpExBeforeTax;

  // ========== MODULE 5: EXIT VALUATION ==========

  // Iterative solve for stabilized value with property tax
  // Value = NOI / (Cap Rate + Tax Rate) approximately
  // More accurate: NOI_after_tax = NOI_before_tax - (Value * Tax Rate)
  // Value = NOI_after_tax / Cap Rate
  // Value = (NOI_before_tax - Value * Tax Rate) / Cap Rate
  // Value * Cap Rate = NOI_before_tax - Value * Tax Rate
  // Value * (Cap Rate + Tax Rate) = NOI_before_tax
  // Value = NOI_before_tax / (Cap Rate + Tax Rate)

  const stabilizedValue = safeDivide(noiBeforeTax, (safeExitCapRate + inputs.propertyTaxRate), 0);
  const propertyTaxAnnual = stabilizedValue * inputs.propertyTaxRate;
  const noiAfterTax = noiBeforeTax - propertyTaxAnnual;

  // ULA Calculation (Measure ULA for City of LA)
  let ulaAmount = 0;
  if (inputs.applyULA && inputs.jurisdiction === 'City of Los Angeles') {
    if (stabilizedValue > inputs.ulaT2Threshold) {
      ulaAmount = stabilizedValue * inputs.ulaT2Rate;
    } else if (stabilizedValue > inputs.ulaT1Threshold) {
      ulaAmount = stabilizedValue * inputs.ulaT1Rate;
    }
  }

  // Exit Costs
  const dispositionCosts = stabilizedValue * (inputs.dispositionBrokerage + inputs.rentalLegalClosing);
  const totalExitCosts = dispositionCosts + ulaAmount;

  // Net Exit Proceeds
  const netExitProceeds = inputs.rentalExitStrategy === 'Sell Stabilized'
    ? stabilizedValue - totalExitCosts
    : stabilizedValue; // Refi & Hold uses gross value for calculations

  // ========== MODULE 6: RENTAL RESIDUALS (5 Methods) ==========

  // Method 1: Yield-on-Cost
  const residualYOC = safeDivide(noiAfterTax, safeYocTarget, 0) - totalDevCostExLand;

  // Method 2: Development Profit Margin
  // Residual = Net Proceeds - (Gross Value * Margin Target) - Dev Cost
  const residualDevMargin = netExitProceeds - (stabilizedValue * inputs.devProfitMarginTarget) - totalDevCostExLand;

  // Method 3: Equity Multiple
  // Let e = Equity %
  // Residual = Net Proceeds / (1 - e + EM * e) - Dev Cost
  const e = inputs.equityPctOfTotalCost;
  const em = inputs.targetEquityMultiple;
  const equityDenominator = 1 - e + em * e;
  const residualEquityMultiple = safeDivide(netExitProceeds, equityDenominator, 0) - totalDevCostExLand;

  // Method 4: Levered IRR (Simplified)
  // n = total project duration in years
  // Residual = Net Proceeds / (1 - e + (1 + IRR)^n * e) - Dev Cost
  const n = (inputs.constructionMonths + inputs.selloutLeaseUpMonths) / 12;
  const irr = inputs.targetLeveredIRR;
  const irrDenominator = 1 - e + Math.pow(1 + irr, n) * e;
  const residualLeveredIRR = safeDivide(netExitProceeds, irrDenominator, 0) - totalDevCostExLand;

  // Method 5: Unlevered ROC
  // Residual = (NOI After Tax / ROC Target) - Dev Cost
  const residualUnleveredROC = safeDivide(noiAfterTax, safeUnleveredROCTarget, 0) - totalDevCostExLand;

  // ========== MODULE 7: HBU DETERMINATION ==========
  let primaryResidual: number;
  let primaryResidualMethod: string;

  if (inputs.hbu === 'Condo') {
    primaryResidual = residualLandCondo;
    primaryResidualMethod = 'For-Sale Condos';
  } else if (inputs.hbu === 'Rental') {
    primaryResidual = residualYOC;
    primaryResidualMethod = 'Rental - YOC';
  } else {
    // "Either" - take max of condo and rental YOC
    if (residualLandCondo >= residualYOC) {
      primaryResidual = residualLandCondo;
      primaryResidualMethod = 'For-Sale Condos';
    } else {
      primaryResidual = residualYOC;
      primaryResidualMethod = 'Rental - YOC';
    }
  }

  // Listing Range
  const listingRangeLow = Math.min(residualLandCondo, residualYOC);
  const listingRangeHigh = Math.max(residualLandCondo, residualYOC);

  // Full Buyer Spectrum
  const allResiduals = [
    residualLandCondo,
    residualYOC,
    residualDevMargin,
    residualEquityMultiple,
    residualLeveredIRR,
    residualUnleveredROC,
  ];
  const fullBuyerSpectrumLow = Math.min(...allResiduals);
  const fullBuyerSpectrumHigh = Math.max(...allResiduals);

  // Per-unit and per-SF metrics (using safe divisors)
  const primaryPerUnit = safeDivide(primaryResidual, safeUnits, 0);
  const primaryPerSFLand = safeDivide(primaryResidual, safeLotSize, 0);
  const primaryPerBuildableSF = safeDivide(primaryResidual, grossBuildingSF, 0);

  // ========== KEY METRICS ==========

  // YOC at primary residual
  const totalProjectCostAtResidual = totalDevCostExLand + primaryResidual;
  const yocAtResidual = safeDivide(noiAfterTax, totalProjectCostAtResidual, 0);

  // Dev Spread (YOC - Exit Cap)
  const devSpreadBps = (yocAtResidual - safeExitCapRate) * 10000;

  // NOI per unit
  const noiPerUnit = safeDivide(noiAfterTax, safeUnits, 0);

  // Expense Ratio
  const expenseRatio = safeDivide(totalOpExBeforeTax, egi, 0);

  // GRM (Gross Rent Multiplier)
  const grm = safeDivide(stabilizedValue, gpr, 0);

  // Land as % of Total Cost
  const landPctOfTotalCost = safeDivide(primaryResidual, (totalDevCostExLand + primaryResidual), 0);

  return {
    // Building metrics
    totalSellableSF,
    grossBuildingSF,
    effectiveParkingSpaces,

    // Cost Stack
    totalVerticalConstruction,
    totalParkingCost,
    totalSiteWork,
    hardCostContingencyAmount,
    totalHardCosts,

    // Soft Costs
    architectureEngineeringAmount,
    permitFees,
    planCheckFees,
    schoolFees,
    parkFees,
    ahlfFees,
    culturalArtsFee,
    buildersRiskAmount,
    wrapGLAmount,
    softCostContingencyAmount,
    totalSoftCosts,

    // Financing
    constructionLoanAmount,
    interestReserveConstruction,
    interestReserveSellout,
    loanOrigination,
    landCarry,
    totalFinancingCarry,

    // Total Dev Cost
    totalDevCostExLand,

    // For-Sale
    grossSalesRevenue,
    totalSellingCosts,
    netSalesRevenue,
    developerProfitCondo,
    residualLandCondo,

    // Rental Income
    affordableUnits,
    marketUnits,
    maxAffordableRent,
    netAffordableRent,
    marketUnitRent,
    gpr,
    otherIncomeAmount,
    gpi,
    egi,

    // OpEx
    managementExpense,
    insuranceExpense,
    repairsMaintenanceExpense,
    utilitiesExpense,
    turnoverExpense,
    generalAdminExpense,
    reservesExpense,
    totalOpExBeforeTax,
    noiBeforeTax,

    // Exit
    stabilizedValue,
    propertyTaxAnnual,
    noiAfterTax,
    ulaAmount,
    totalExitCosts,
    netExitProceeds,

    // Rental Residuals
    residualYOC,
    residualDevMargin,
    residualEquityMultiple,
    residualLeveredIRR,
    residualUnleveredROC,

    // HBU
    primaryResidual,
    primaryResidualMethod,
    listingRangeLow,
    listingRangeHigh,
    fullBuyerSpectrumLow,
    fullBuyerSpectrumHigh,

    // Per-unit metrics
    primaryPerUnit,
    primaryPerSFLand,
    primaryPerBuildableSF,

    // Key Metrics
    yocAtResidual,
    devSpreadBps,
    noiPerUnit,
    expenseRatio,
    grm,
    landPctOfTotalCost,
  };
}

// Generate sanity check warnings
export function generateSanityChecks(inputs: DealInputs, calcs: DealCalculations): SanityCheck[] {
  const checks: SanityCheck[] = [];

  // Condo residual check
  if (calcs.residualLandCondo < 0) {
    checks.push({
      id: 'condo-negative',
      type: 'warning',
      message: 'Condo residual does not pencil under these assumptions',
      field: 'residualLandCondo',
    });
  }

  // Rental YOC residual check
  if (calcs.residualYOC < 0) {
    checks.push({
      id: 'rental-yoc-negative',
      type: 'warning',
      message: 'Rental YOC residual does not pencil under these assumptions',
      field: 'residualYOC',
    });
  }

  // Dev spread check
  if (calcs.devSpreadBps < 100) {
    checks.push({
      id: 'thin-spread',
      type: 'warning',
      message: `Dev spread of ${Math.round(calcs.devSpreadBps)} bps is thin - institutional buyer pool narrows`,
      field: 'devSpreadBps',
    });
  }

  // Hard cost range check
  const hardCostPSF = calcs.grossBuildingSF > 0 ? calcs.totalHardCosts / calcs.grossBuildingSF : 0;
  if (hardCostPSF > 0 && (hardCostPSF < 240 || hardCostPSF > 600)) {
    checks.push({
      id: 'hard-cost-range',
      type: 'warning',
      message: `Hard costs of $${Math.round(hardCostPSF)}/SF are outside typical LA range ($240-$600)`,
      field: 'baseBuildingCostPSF',
    });
  }

  // Expense ratio check (only if EGI > 0)
  if (calcs.egi > 0 && calcs.expenseRatio > 0.40) {
    checks.push({
      id: 'expense-ratio-high',
      type: 'warning',
      message: `Expense ratio of ${(calcs.expenseRatio * 100).toFixed(1)}% is unusually high (>40%)`,
      field: 'expenseRatio',
    });
  }

  // GRM check (only if GPR > 0)
  if (calcs.gpr > 0 && (calcs.grm < 10 || calcs.grm > 18)) {
    checks.push({
      id: 'grm-range',
      type: 'warning',
      message: `GRM of ${calcs.grm.toFixed(1)} is outside typical LA range (10-18)`,
      field: 'grm',
    });
  }

  // Sale price check for condos
  if (inputs.salePricePSF < 500 || inputs.salePricePSF > 1500) {
    checks.push({
      id: 'sale-price-range',
      type: 'info',
      message: `Sale price of $${inputs.salePricePSF}/SF is outside typical LA condo range ($500-$1,500)`,
      field: 'salePricePSF',
    });
  }

  // Cap rate check
  if (inputs.exitCapRate < 0.035 || inputs.exitCapRate > 0.07) {
    checks.push({
      id: 'cap-rate-range',
      type: 'info',
      message: `Exit cap rate of ${(inputs.exitCapRate * 100).toFixed(2)}% is outside typical LA range (3.5%-7%)`,
      field: 'exitCapRate',
    });
  }

  // Land % of total cost check
  if (calcs.landPctOfTotalCost > 0.35) {
    checks.push({
      id: 'land-pct-high',
      type: 'info',
      message: `Land at ${(calcs.landPctOfTotalCost * 100).toFixed(1)}% of total cost is higher than typical (usually <35%)`,
      field: 'landPctOfTotalCost',
    });
  }

  return checks;
}

// Generate sensitivity table for Condo: Sale $/SF vs Hard Cost $/SF
export function generateCondoSensitivity(
  inputs: DealInputs,
  salePriceRange: number[] = [550, 600, 650, 700, 750, 800, 850, 900, 950],
  hardCostRange: number[] = [240, 265, 290, 315, 340, 365, 390, 415]
): { rows: number[]; cols: number[]; values: number[][] } {
  const values: number[][] = [];

  for (const hardCost of hardCostRange) {
    const row: number[] = [];
    for (const salePrice of salePriceRange) {
      const modifiedInputs = {
        ...inputs,
        baseBuildingCostPSF: hardCost,
        salePricePSF: salePrice,
      };
      const calcs = calculateDeal(modifiedInputs);
      row.push(calcs.residualLandCondo);
    }
    values.push(row);
  }

  return { rows: hardCostRange, cols: salePriceRange, values };
}

// Generate sensitivity table for Rental: Rent $/SF/Mo vs Exit Cap Rate
export function generateRentalSensitivity(
  inputs: DealInputs,
  rentRange: number[] = [3.00, 3.25, 3.50, 3.75, 4.00, 4.25, 4.50, 4.75, 5.00],
  capRateRange: number[] = [0.04, 0.0425, 0.045, 0.0475, 0.05, 0.0525, 0.055, 0.0575, 0.06]
): { rows: number[]; cols: number[]; values: number[][] } {
  const values: number[][] = [];

  for (const capRate of capRateRange) {
    const row: number[] = [];
    for (const rent of rentRange) {
      const modifiedInputs = {
        ...inputs,
        marketRentPSF: rent,
        exitCapRate: capRate,
      };
      const calcs = calculateDeal(modifiedInputs);
      row.push(calcs.residualYOC);
    }
    values.push(row);
  }

  return { rows: capRateRange, cols: rentRange, values };
}

// Create a full deal object
export function createDeal(inputs: DealInputs): Deal {
  const calculations = calculateDeal(inputs);
  const sanityChecks = generateSanityChecks(inputs, calculations);

  return {
    inputs,
    calculations,
    sanityChecks,
  };
}
