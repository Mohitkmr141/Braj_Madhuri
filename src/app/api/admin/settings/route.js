import { verifyAdminToken } from '../../../../lib/auth.js';
import { NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma.js';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || !(await verifyAdminToken(session.value))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const prisma = getPrisma();
  try {
    let settings = await prisma.siteSettings.findUnique({
      where: { id: 'global' }
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          id: 'global',
          isSaleActive: false,
          saleDiscountPercentage: 0,
        }
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || !(await verifyAdminToken(session.value))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const prisma = getPrisma();
  try {
    const data = await request.json();
    const { isSaleActive, saleDiscountPercentage, saleBannerUrl, saleTitle } = data;

    const sanitizedDiscount = Math.min(100, Math.max(0, parseFloat(saleDiscountPercentage) || 0));

    const updatedSettings = await prisma.siteSettings.upsert({
      where: { id: 'global' },
      update: {
        isSaleActive: Boolean(isSaleActive),
        saleDiscountPercentage: sanitizedDiscount,
        saleBannerUrl: saleBannerUrl || null,
        saleTitle: saleTitle || null
      },
      create: {
        id: 'global',
        isSaleActive: Boolean(isSaleActive),
        saleDiscountPercentage: sanitizedDiscount,
        saleBannerUrl: saleBannerUrl || null,
        saleTitle: saleTitle || null
      }
    });

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 });
  }
}
