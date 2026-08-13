import { NextResponse } from 'next/server';
import { getPrisma } from '../../../lib/prisma.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const prisma = getPrisma();
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'global' }
    });

    if (!settings) {
      return NextResponse.json({ success: true, settings: { isSaleActive: false, saleDiscountPercentage: 0 } });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}
