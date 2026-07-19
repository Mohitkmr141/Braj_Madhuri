import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { 
  generateAWB, 
  generatePickup, 
  generateManifest, 
  printManifest, 
  generateLabel, 
  printInvoice, 
  trackAWB 
} from '../../../../lib/shiprocket.js';
import { cookies } from 'next/headers';

let prisma;
function getPrisma() {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

export async function POST(request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const prisma = getPrisma();
  try {
    const { action, orderId } = await request.json();
    
    if (!action || !orderId) {
      return NextResponse.json({ success: false, error: 'Missing action or orderId' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || !order.shiprocketOrderId) {
      return NextResponse.json({ success: false, error: 'Order not found or not synced with Shiprocket' }, { status: 400 });
    }

    const shiprocketOrderId = order.shiprocketOrderId;
    const shipmentId = order.shiprocketShipmentId;

    let result;

    switch (action) {
      case 'generate_awb':
        // Generate AWB requires shipment_id, which we might not have saved yet if it's the first time
        // Wait, Shiprocket create order response gives shipment_id. If we don't have it, we might need to fetch it.
        // But for simplicity, we assume we either have it or Shiprocket generate AWB can accept it.
        // Actually, createShiprocketOrder returns order_id and shipment_id. Let's see if we saved shipment_id.
        if (!shipmentId) {
           return NextResponse.json({ success: false, error: 'shipmentId not found on order. Ensure it was saved.' }, { status: 400 });
        }
        result = await generateAWB(shipmentId);
        if (result && result.response && result.response.data && result.response.data.awb_code) {
          await prisma.order.update({
            where: { id: order.id },
            data: { awbCode: result.response.data.awb_code }
          });
        }
        break;

      case 'generate_pickup':
        if (!shipmentId) throw new Error('Missing shipmentId');
        result = await generatePickup(shipmentId);
        break;

      case 'generate_manifest':
        if (!shipmentId) throw new Error('Missing shipmentId');
        result = await generateManifest(shipmentId);
        break;

      case 'print_manifest':
        if (!shipmentId) throw new Error('Missing shipmentId');
        result = await printManifest(shipmentId);
        break;

      case 'generate_label':
        if (!shipmentId) throw new Error('Missing shipmentId');
        result = await generateLabel(shipmentId);
        break;

      case 'print_invoice':
        result = await printInvoice([shiprocketOrderId]);
        break;

      case 'track_awb':
        if (!order.awbCode) throw new Error('No AWB code generated for this order yet.');
        result = await trackAWB(order.awbCode);
        break;

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error(`Shiprocket API action failed:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Action failed' },
      { status: 500 }
    );
  }
}
