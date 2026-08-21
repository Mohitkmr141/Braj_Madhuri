import { verifyAdminToken } from '../../../../lib/auth.js';
import { getPrisma } from '../../../../lib/prisma.js';
import { NextResponse } from 'next/server';
import { 
  createShiprocketOrder,
  generateAWB, 
  generatePickup, 
  generateManifest, 
  printManifest, 
  generateLabel, 
  printInvoice, 
  trackAWB 
} from '../../../../lib/shiprocket.js';
import { cookies } from 'next/headers';

export async function POST(request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || !(await verifyAdminToken(session.value))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const prisma = getPrisma();
  try {
    const { action, orderId } = await request.json();
    
    if (!action || !orderId) {
      return NextResponse.json({ success: false, error: 'Missing action or orderId' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Allow sync_order action even when not yet synced with Shiprocket
    if (action === 'sync_order') {
      const srResult = await createShiprocketOrder(order);
      if (srResult && (srResult.order_id || srResult.shipment_id)) {
        const updated = await prisma.order.update({
          where: { id: order.id },
          data: {
            shiprocketOrderId: srResult.order_id,
            shiprocketShipmentId: srResult.shipment_id,
          },
        });
        return NextResponse.json({ 
          success: true, 
          message: 'Successfully synced with Shiprocket', 
          data: srResult, 
          order: updated 
        });
      } else {
        throw new Error(srResult?.message || 'Shiprocket did not return an order ID. Check address/phone details.');
      }
    }

    if (!order.shiprocketOrderId) {
      return NextResponse.json({ success: false, error: 'Order is not yet synced with Shiprocket. Please sync order first.' }, { status: 400 });
    }

    const shiprocketOrderId = order.shiprocketOrderId;
    const shipmentId = order.shiprocketShipmentId;

    let result;

    switch (action) {
      case 'generate_awb':
        if (!shipmentId) {
           return NextResponse.json({ success: false, error: 'shipmentId not found on order. Ensure order is synced.' }, { status: 400 });
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
