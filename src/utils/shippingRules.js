/**
 * Delhi-NCR Smart Delivery Fee Calculator
 * 
 * Accurately determines whether a delivery location belongs to the National Capital Region (NCR),
 * covering NCT of Delhi, 14 Haryana districts, and 8 Uttar Pradesh districts.
 * 
 * Rates:
 * - Delhi-NCR (Local Logistics Zone): ₹79
 * - Rest of India (National Logistics Zone): ₹119
 */

export const SHIPPING_RATES = {
  NCR: 79,
  NATIONAL: 119,
};

// All 22 NCR districts & sub-regions and major towns across Haryana & Uttar Pradesh
const NCR_CITY_PATTERNS = [
  // Delhi
  /\bdelhi\b/i,
  /\bnew\s*delhi\b/i,
  /\bnct\b/i,

  // Uttar Pradesh NCR (8 Districts + Towns)
  /\bnoida\b/i,
  /\bgreater\s*noida\b/i,
  /\bgr\.?\s*noida\b/i,
  /\bgautam\s*(?:budh|buddha)\s*nagar\b/i,
  /\bdadri\b/i,
  /\bjewar\b/i,
  /\bghaziabad\b/i,
  /\bindirapuram\b/i,
  /\bvaishali\b/i,
  /\bvasundhara\b/i,
  /\bkaushambi\b/i,
  /\bsahibabad\b/i,
  /\bmodinagar\b/i,
  /\bloni\b/i,
  /\bmuradnagar\b/i,
  /\bcrossings\s*republik\b/i,
  /\bmeerut\b/i,
  /\bsardhana\b/i,
  /\bmawana\b/i,
  /\bhapur\b/i,
  /\bpilkhuwa\b/i,
  /\bgarhmukteshwar\b/i,
  /\bbaghpat\b/i,
  /\bbaraut\b/i,
  /\bkhekra\b/i,
  /\bbulandshahr\b/i,
  /\bbulandshahar\b/i,
  /\bkhurja\b/i,
  /\bsikandrabad\b/i,
  /\bgulaothi\b/i,
  /\bsiyana\b/i,
  /\banupshahr\b/i,
  /\bdibai\b/i,
  /\bshikarpur\b/i,
  /\bmuzaffarnagar\b/i,
  /\bkhatauli\b/i,
  /\bbudhana\b/i,
  /\bjansath\b/i,
  /\bshamli\b/i,
  /\bkairana\b/i,
  /\bthana\s*bhawan\b/i,

  // Haryana NCR (14 Districts + Towns)
  /\bgurugram\b/i,
  /\bgurgaon\b/i,
  /\bmanesar\b/i,
  /\bsohna\b/i,
  /\bpataudi\b/i,
  /\bfaridabad\b/i,
  /\bballabgarh\b/i,
  /\bballabhgarh\b/i,
  /\bsonipat\b/i,
  /\bsonepat\b/i,
  /\bkundli\b/i,
  /\brai\b/i,
  /\bmurthal\b/i,
  /\bganaur\b/i,
  /\bgohana\b/i,
  /\bpanipat\b/i,
  /\bsamalkha\b/i,
  /\brohtak\b/i,
  /\bmeham\b/i,
  /\bsampla\b/i,
  /\bjhajjar\b/i,
  /\bbahadurgarh\b/i,
  /\bberi\b/i,
  /\brewari\b/i,
  /\bbawal\b/i,
  /\bdharuhera\b/i,
  /\bpalwal\b/i,
  /\bhodal\b/i,
  /\bhathin\b/i,
  /\bnuh\b/i,
  /\bmewat\b/i,
  /\btaoru\b/i,
  /\btawru\b/i,
  /\bpunhana\b/i,
  /\bferozepur\s*jhirka\b/i,
  /\bkarnal\b/i,
  /\bgharaunda\b/i,
  /\bnilokheri\b/i,
  /\bassandh\b/i,
  /\bindri\b/i,
  /\bbhiwani\b/i,
  /\bcharkhi\s*dadri\b/i,
  /\bmahendragarh\b/i,
  /\bmohindargarh\b/i,
  /\bnarnaul\b/i,
  /\bjind\b/i,
  /\bnarwana\b/i,
  /\bsafidon\b/i,
];

/**
 * Checks if a 6-digit Indian pincode belongs to the Delhi-NCR cluster.
 */
export function isNCRPincode(pincode) {
  if (!pincode) return false;
  const cleanPin = String(pincode).replace(/\D/g, "");
  if (cleanPin.length !== 6) return false;

  // 1. All Delhi Pincodes (110001 - 110096)
  if (cleanPin.startsWith("11")) return true;

  // 2. Faridabad & Palwal (121xxx)
  if (cleanPin.startsWith("121")) return true;

  // 3. Gurugram, Manesar, Nuh/Mewat (122xxx)
  if (cleanPin.startsWith("122")) return true;

  // 4. Rewari & Mahendragarh/Narnaul (123xxx)
  if (cleanPin.startsWith("123")) return true;

  // 5. Rohtak & Jhajjar/Bahadurgarh (124xxx)
  if (cleanPin.startsWith("124")) return true;

  // 6. Jind (126xxx)
  if (cleanPin.startsWith("126")) return true;

  // 7. Bhiwani & Charkhi Dadri (127xxx)
  if (cleanPin.startsWith("127")) return true;

  // 8. Sonipat/Kundli (131xxx)
  if (cleanPin.startsWith("131")) return true;

  // 9. Panipat & Karnal (132xxx)
  if (cleanPin.startsWith("132")) return true;

  // 10. Ghaziabad & Loni/Modinagar (2010xx, 2012xx)
  if (cleanPin.startsWith("2010") || cleanPin.startsWith("2012")) return true;

  // 11. Gautam Buddha Nagar: Noida, Greater Noida, Dadri (2013xx)
  if (cleanPin.startsWith("2013")) return true;

  // 12. Bulandshahr / Khurja / Sikandrabad (203xxx)
  if (cleanPin.startsWith("203")) return true;

  // 13. Hapur (245xxx)
  if (cleanPin.startsWith("245")) return true;

  // 14. Shamli (2477xx)
  if (cleanPin.startsWith("2477")) return true;

  // 15. Meerut & Baghpat/Baraut (250xxx)
  if (cleanPin.startsWith("250")) return true;

  // 16. Muzaffarnagar (251xxx)
  if (cleanPin.startsWith("251")) return true;

  return false;
}

/**
 * Evaluates whether an address is within Delhi-NCR based on State, City/District, and Pincode.
 * 
 * @param {Object} location
 * @param {string} [location.state]
 * @param {string} [location.city]
 * @param {string} [location.pincode]
 * @returns {boolean}
 */
export function isDelhiNCR({ state = "", city = "", pincode = "" } = {}) {
  const normState = String(state || "").trim().toLowerCase();
  const normCity = String(city || "").trim();
  const normPin = String(pincode || "").replace(/\D/g, "");

  // 1. Direct State Match
  if (normState === "delhi" || normState === "delhi ncr" || normState === "new delhi") {
    return true;
  }

  // 2. Accurate Pincode Match
  if (isNCRPincode(normPin)) {
    return true;
  }

  // 3. City / District / Landmark Keyword Match
  if (normCity) {
    for (const pattern of NCR_CITY_PATTERNS) {
      if (pattern.test(normCity)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculates delivery fee based on customer location.
 * 
 * @param {Object} location
 * @param {string} [location.state]
 * @param {string} [location.city]
 * @param {string} [location.pincode]
 * @returns {number} 79 for Delhi-NCR, 119 for Rest of India, 0 if no location entered yet
 */
export function calculateShippingFee({ state = "", city = "", pincode = "" } = {}) {
  const normState = String(state || "").trim();
  const normCity = String(city || "").trim();
  const normPin = String(pincode || "").trim();

  // If no location details provided at all
  if (!normState && !normCity && !normPin) {
    return 0;
  }

  // If Delhi-NCR detected
  if (isDelhiNCR({ state: normState, city: normCity, pincode: normPin })) {
    return SHIPPING_RATES.NCR; // ₹79
  }

  // Valid location entered, but outside NCR
  if (normState) {
    return SHIPPING_RATES.NATIONAL; // ₹119
  }

  return 0;
}
