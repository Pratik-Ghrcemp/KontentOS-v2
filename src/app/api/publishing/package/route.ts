import { NextRequest, NextResponse } from 'next/server';
import { generatePlatformPackages } from '@/lib/publishing/packager';
import { PackagingInput } from '@/lib/publishing/types';

export async function POST(req: NextRequest) {
  try {
    const body: PackagingInput = await req.json();

    if (!body || !body.renderResult) {
      return NextResponse.json(
        { error: 'Missing renderResult in packaging request body' },
        { status: 400 }
      );
    }

    const packages = await generatePlatformPackages(body);

    return NextResponse.json({
      success: true,
      packages,
      count: packages.length,
    });
  } catch (error: any) {
    console.error('Error generating platform packages:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error packaging platform assets' },
      { status: 500 }
    );
  }
}
