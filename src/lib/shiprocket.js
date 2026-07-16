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
 * Calls the Shiprocket Courier Serviceability API to fetch live rates.
 * @param {string} deliveryPincode - The customer's pincode
 * @param {number} weight - Weight of the package in kg (default 0.5)
 * @param {number} cod - 1 for COD, 0 for prepaid. (Default 0 since we only accept online payments)
 */
export async function calculateShipping(deliveryPincode, weight = 0.5, cod = 0) {
  const token = await getShiprocketToken();
  const pickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE || "281121"; // Default to Vrindavan if not set

  const url = new URL(`${SHIPROCKET_BASE_URL}/courier/serviceability/`);
  url.searchParams.append("pickup_postcode", pickupPincode);
  url.searchParams.append("delivery_postcode", deliveryPincode);
  url.searchParams.append("weight", weight);
  url.searchParams.append("cod", cod);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to calculate shipping rates: ${errorData.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data; // This contains the recommended_courier_company_id and available_courier_companies
}

/**
 * Maps your website's order data and sends it to Shiprocket API.
 * @param {object} order - The order object from your database/checkout
 */
export async function createShiprocketOrder(order) {
  const token = await getShiprocketToken();

  // Map order items to Shiprocket format
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
    order_date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
    pickup_location: "Primary", // You may need to change this to your actual Shiprocket pickup location name
    billing_customer_name: order.customerName,
    billing_last_name: "",
    billing_address: order.address,
    billing_city: order.city,
    billing_pincode: order.pincode,
    billing_state: order.state,
    billing_country: "India",
    billing_email: order.email,
    billing_phone: order.phone,
    shipping_is_billing: true, // Assuming shipping address is same as billing
    order_items: orderItems,
    payment_method: "Prepaid", // We only accept online payments
    shipping_charges: order.shippingCost || 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total: order.totalAmount,
    length: 10, // Default dimensions in cm
    breadth: 10,
    height: 10,
    weight: 0.5, // Default weight in kg
  };

  const response = await fetch(`${SHIPROCKET_BASE_URL}/orders/create/ad-hoc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(shiprocketOrderData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to create Shiprocket order: ${errorData.message || response.statusText}`);
  }

  const data = await response.json();
  return data; // Contains order_id, shipment_id, status
}
