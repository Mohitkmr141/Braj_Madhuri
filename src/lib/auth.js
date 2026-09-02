import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';

const getSecretKey = () => {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.ADMIN_PASSWORD || 'default_fallback_secret_do_not_use_in_prod';
  return new TextEncoder().encode(secret);
};

export async function signAdminToken() {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());
  return token;
}

export async function verifyAdminToken(token) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

/**
 * Generates a tamper-proof HMAC verification token for an order.
 * Used to grant guest/checkout customers secure access to their specific order receipt on /success.
 */
export function generateOrderAccessToken(orderNumber) {
  if (!orderNumber || typeof orderNumber !== 'string') return '';
  const secret =
    process.env.NEXTAUTH_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    process.env.ADMIN_JWT_SECRET ||
    process.env.ADMIN_PASSWORD ||
    'bm_order_token_salt_secret';

  return crypto
    .createHmac('sha256', secret)
    .update(`order_receipt_${orderNumber.trim()}`)
    .digest('hex');
}

/**
 * Verifies a customer order access token using timing-safe comparison.
 */
export function verifyOrderAccessToken(orderNumber, token) {
  if (!orderNumber || !token || typeof token !== 'string') return false;
  const expected = generateOrderAccessToken(orderNumber);
  const expectedBuf = Buffer.from(expected, 'utf8');
  const receivedBuf = Buffer.from(token.trim(), 'utf8');

  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

