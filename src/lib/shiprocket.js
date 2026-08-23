export const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

let _cachedToken = null;
let _tokenExpiresAt = 0;

/**
 * Authenticates with Shiprocket and retrieves a secure session token with caching.
 */
export async function getShiprocketToken() {
  const now = Date.now();
  if (_cachedToken && now < _tokenExpiresAt) {
    return _cachedToken;
  }

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
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || response.statusText;
    } catch {
      // ignore
    }
    throw new Error(`Failed to authenticate with Shiprocket: ${errorMessage}`);
  }

  const data = await response.json();
  _cachedToken = data.token;
  // Cache for 9 days (Shiprocket tokens expire in 10 days)
  _tokenExpiresAt = now + (9 * 24 * 60 * 60 * 1000);
  return _cachedToken;
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
    // Clear cached token on 401 so the next call re-authenticates
    if (response.status === 401) {
      _cachedToken = null;
      _tokenExpiresAt = 0;
    }
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || response.statusText;
    } catch {
      // Ignore if response is not JSON
    }
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
  let items = [];
  try {
    items = typeof order.cartItems === 'string' ? JSON.parse(order.cartItems) : (order.cartItems || []);
  } catch (e) {
    items = [];
  }
  if (!Array.isArray(items)) items = [];

  const orderItems = items.map((item) => ({
    name: (item.title || "Product").slice(0, 100),
    sku: (item.id || "SKU-UNKNOWN").slice(0, 50),
    units: parseInt(item.quantity, 10) || 1,
    selling_price: parseFloat(item.price) || 0,
    discount: 0,
    tax: 0,
    hsn: "",
  }));

  let resolvedState = (order.state || "Delhi").trim();
  if (resolvedState === "Delhi NCR") resolvedState = "Delhi";
  else if (resolvedState === "Rest of India") resolvedState = "Delhi";

  const totalQty = orderItems.reduce((sum, it) => sum + (it.units || 1), 0);
  const subTotal = orderItems.reduce((acc, it) => acc + (it.selling_price * it.units), 0);
  const totalDiscount = Math.max(0, Math.round(subTotal + (order.shippingCost || 0) - (order.totalAmount || 0)));

  const shiprocketOrderData = {
    order_id: order.orderNumber,
    order_date: new Date().toISOString().split("T")[0],
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Home",
    billing_customer_name: order.customerName && order.customerName.length >= 3 ? order.customerName : (order.customerName || "Guest") + " Customer",
    billing_last_name: "",
    billing_address: order.address || "No Address Provided",
    billing_city: order.city || "Unknown",
    billing_pincode: order.pincode || "110001",
    billing_state: resolvedState,
    billing_country: "India",
    billing_email: order.email || "no-reply@thebrajmadhuri.com",
    billing_phone: (() => {
      let p = order.phone ? order.phone.replace(/\D/g, "") : "";
      if (p.length < 10) return "9999999999";
      return p.slice(-15);
    })(),
    shipping_is_billing: true,
    order_items: orderItems,
    payment_method: "Prepaid",
    shipping_charges: order.shippingCost || 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: totalDiscount,
    sub_total: subTotal || order.totalAmount,
    // Estimate package dimensions dynamically based on total item count
    length: totalQty <= 2 ? 15 : totalQty <= 5 ? 25 : 35,
    breadth: totalQty <= 2 ? 10 : 15,
    height: totalQty <= 2 ? 8 : totalQty <= 5 ? 12 : 18,
    weight: Math.max(0.5, Math.round(totalQty * 0.3 * 10) / 10), // ~300g per item, min 500g
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
