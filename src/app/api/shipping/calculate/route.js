import { calculateShipping } from "../../../../lib/shiprocket";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { pincode, weight = 0.5 } = await request.json();

    if (!pincode) {
      return NextResponse.json(
        { error: "Pincode is required" },
        { status: 400 }
      );
    }

    const rates = await calculateShipping(pincode, weight);

    // Filter to find the cheapest rate or default to 0 if none found
    let minRate = null;
    const couriers = rates?.available_courier_companies;
    if (Array.isArray(couriers) && couriers.length > 0) {
      const validRates = couriers.map((c) => Number(c.rate)).filter((r) => !isNaN(r) && r >= 0);
      if (validRates.length > 0) {
        minRate = Math.min(...validRates);
      }
    }

    return NextResponse.json({
      success: true,
      shippingCost: minRate || 0,
      rates: rates,
    });
  } catch (error) {
    console.error("Shipping calculation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate shipping" },
      { status: 500 }
    );
  }
}
