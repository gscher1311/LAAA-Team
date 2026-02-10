import { NextRequest, NextResponse } from 'next/server';
import { parseZIMASText, zimasToInputs, validateZIMASData } from '@/lib/zimas-parser';
import { extractText } from 'unpdf';

// Force dynamic to avoid build-time evaluation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PDF parsing function with graceful error handling
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Convert Buffer to Uint8Array as required by unpdf
    const uint8Array = new Uint8Array(buffer);
    const { text } = await extractText(uint8Array);
    // unpdf returns text as array of strings (one per page), join them
    return Array.isArray(text) ? text.join('\n') : text;
  } catch (error) {
    console.error('PDF parse library error:', error);
    throw new Error('PDF parsing failed');
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Try to parse PDF
    let text: string;
    try {
      text = await extractTextFromPDF(buffer);
    } catch {
      return NextResponse.json(
        {
          error: 'PDF parsing is temporarily unavailable. Please manually enter the ZIMAS data.',
          suggestion: 'Copy the text from your ZIMAS PDF and use it as reference while filling in the form.'
        },
        { status: 503 }
      );
    }

    // Extract ZIMAS data from text
    const zimasData = parseZIMASText(text);

    // Validate extracted data
    const validation = validateZIMASData(zimasData);

    // Convert to deal inputs
    const dealInputs = zimasToInputs(zimasData);

    return NextResponse.json({
      success: true,
      data: {
        zimas: zimasData,
        inputs: dealInputs,
        validation,
        textLength: text.length,
      },
    });
  } catch (error) {
    console.error('ZIMAS parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse PDF', details: String(error) },
      { status: 500 }
    );
  }
}
