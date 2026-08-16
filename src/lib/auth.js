import { SignJWT, jwtVerify } from 'jose';

const getSecretKey = () => {
  const secret = process.env.ADMIN_PASSWORD || 'default_fallback_secret_do_not_use_in_prod';
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
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.role === 'admin';
  } catch (error) {
    return false;
  }
}
