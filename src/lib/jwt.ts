import { jwtVerify, SignJWT } from 'jose';

export const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET || 'a-very-secure-default-secret-key-12345!';
  return new TextEncoder().encode(secret);
};

export async function verifyJwtToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload;
  } catch (error) {
    return null;
  }
}

export async function signJwtToken(payload: any) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // Token expires in 24 hours
    .sign(getJwtSecretKey());
  
  return token;
}
