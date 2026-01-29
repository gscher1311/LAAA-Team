import { NextRequest, NextResponse } from 'next/server';
import { getShareByToken, getDealById, incrementShareViewCount } from '@/lib/db';
import { calculateDeal, generateSanityChecks } from '@/lib/calculations';
import { DealInputs } from '@/types/deal';

// Public endpoint - no auth required
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Share token is required' },
        { status: 400 }
      );
    }

    // Get share by token
    const share = getShareByToken(token);
    if (!share) {
      return NextResponse.json(
        { error: 'Share link is invalid or has expired' },
        { status: 404 }
      );
    }

    // Get the deal
    const deal = getDealById(share.deal_id);
    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // Increment view count
    incrementShareViewCount(token);

    // Parse deal inputs
    const inputs = JSON.parse(deal.inputs) as DealInputs;

    // Calculate derived values
    const calculations = calculateDeal(inputs);
    const sanityChecks = generateSanityChecks(inputs, calculations);

    // Return data based on share type
    if (share.share_type === 'summary') {
      // Summary only - limited data for client view
      return NextResponse.json({
        success: true,
        share_type: 'summary',
        deal: {
          name: deal.name,
          propertyAddress: inputs.propertyAddress,
          updatedAt: deal.updated_at,
        },
        summary: {
          // Key metrics
          lotSize: inputs.lotSize,
          units: inputs.units,
          totalBuildingSF: calculations.grossBuildingSF,

          // Residual values
          condoResidual: calculations.residualLandCondo,
          yocResidual: calculations.residualYOC,
          devMarginResidual: calculations.residualDevMargin,
          equityMultipleResidual: calculations.residualEquityMultiple,
          leveredIRRResidual: calculations.residualLeveredIRR,
          unleveredROCResidual: calculations.residualUnleveredROC,

          // Per-unit metrics
          residualPerUnit: calculations.primaryPerUnit,
          residualPerSF: calculations.primaryPerSFLand,

          // Key assumptions
          salePricePSF: inputs.salePricePSF,
          baseBuildingCostPSF: inputs.baseBuildingCostPSF,
          condoProfitMargin: inputs.condoProfitMargin,
        },
        sanityChecks: sanityChecks.filter(c => c.type !== 'info'),
      });
    }

    // Full view - all data
    return NextResponse.json({
      success: true,
      share_type: 'full',
      deal: {
        name: deal.name,
        propertyAddress: inputs.propertyAddress,
        updatedAt: deal.updated_at,
      },
      inputs,
      calculations,
      sanityChecks,
    });
  } catch (error) {
    console.error('View share error:', error);
    return NextResponse.json(
      { error: 'Failed to load shared deal' },
      { status: 500 }
    );
  }
}
