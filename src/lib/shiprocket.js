export const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

/**
 * Authenticates with Shiprocket and retrieves a secure session token.
 */
export async function getShiprocketToken() {

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error("Shiprocket credentials are not configured in the environment variables.");
  }

  const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to authenticate with Shiprocket: ${errorData.message || response.statusText}`);
  }

  const data = await response.json();
  return data.token;
}

/**
 * Helper to make API calls to Shiprocket with auth
 */
async function shiprocketRequest(endpoint, method = "GET", body = null) {
  const token = await getShiprocketToken();
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${SHIPROCKET_BASE_URL}${endpoint}`, options);
  
  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || response.statusText;
    } catch(e) {}
    throw new Error(`Shiprocket API Error (${endpoint}): ${errorMessage}`);
  }

  return response.json();
}

/**
 * Calls the Shiprocket Courier Serviceability API to fetch live rates.
 */
export async function calculateShipping(deliveryPincode, weight = 0.5, cod = 0) {
  const pickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE || "281121"; // Default to Vrindavan if not set
  const endpoint = `/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=${cod}`;
  const data = await shiprocketRequest(endpoint);
  return data.data; // This contains the recommended_courier_company_id and available_courier_companies
}

/**
 * Maps your website's order data and sends it to Shiprocket API.
 */
export async function createShiprocketOrder(order) {
  const orderItems = order.cartItems.map((item) => ({
    name: item.title,
    sku: item.id || "SKU-UNKNOWN",
    units: item.quantity || 1,
    selling_price: item.price,
    discount: 0,
    tax: 0,
    hsn: "",
  }));

  const shiprocketOrderData = {
    order_id: order.orderNumber,
    order_date: new Date().toISOString().split("T")[0],
    pickup_location: "Primary",
    billing_customer_name: order.customerName,
    billing_last_name: "",
    billing_address: order.address,
    billing_city: order.city,
    billing_pincode: order.pincode,
    billing_state: order.state,
    billing_country: "India",
    billing_email: order.email,
    billing_phone: order.phone,
    shipping_is_billing: true,
    order_items: orderItems,
    payment_method: "Prepaid",
    shipping_charges: order.shippingCost || 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total: order.totalAmount,
    length: 10,
    breadth: 10,
    height: 10,
    weight: 0.5,
  };

  return shiprocketRequest("/orders/create/adhoc", "POST", shiprocketOrderData);
}

/**
 * Generate AWB for a shipment
 */
export async function generateAWB(shipmentId) {
  return shiprocketRequest("/courier/assign/awb", "POST", {
    shipment_id: shipmentId,
  });
}

/**
 * Generate Pickup for a shipment
 */
export async function generatePickup(shipmentId) {
  return shiprocketRequest("/courier/generate/pickup", "POST", {
    shipment_id: [shipmentId],
  });
}

/**
 * Generate Manifest
 */
export async function generateManifest(shipmentId) {
  return shiprocketRequest("/manifests/generate", "POST", {
    shipment_id: [shipmentId],
  });
}

/**
 * Print Manifest
 */
export async function printManifest(shipmentId) {
  return shiprocketRequest("/manifests/print", "POST", {
    shipment_ids: [shipmentId],
  });
}

/**
 * Generate Label
 */
export async function generateLabel(shipmentId) {
  return shiprocketRequest("/courier/generate/label", "POST", {
    shipment_id: [shipmentId],
  });
}

/**
 * Print Invoice
 */
export async function printInvoice(orderIds) {
  return shiprocketRequest("/orders/print/invoice", "POST", {
    ids: orderIds,
  });
}

/**
 * Track AWB
 */
export async function trackAWB(awbCode) {
  return shiprocketRequest(`/courier/track/awb/${awbCode}`, "GET");
}
