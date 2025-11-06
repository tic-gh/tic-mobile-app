import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  exp: number;
  iat: number;
  sub: string;
  [key: string]: any;
}

/**
 * Decodes a JWT token and returns the payload
 * @param token - The JWT token to decode
 * @returns The decoded token payload or null if decoding fails
 */
export function decodeJwt(token: string): DecodedToken | null {
  try {
    return jwtDecode(token) as DecodedToken;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Checks if a JWT token is expired
 * @param token - The JWT token to check
 * @returns True if the token is expired or invalid, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  if (!token) {
    return true; // No token, consider it expired
  }

  const decodedToken = decodeJwt(token);

  if (!decodedToken || !decodedToken.exp) {
    return true; // Invalid or missing expiration claim
  }

  const currentTime = Date.now() / 1000; // Current time in seconds

  return decodedToken.exp < currentTime;
}

/**
 * Gets the token from localStorage and checks if it's expired
 * @returns True if the token is expired or invalid, false otherwise
 */
export function isStoredTokenExpired(): boolean {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return true;
  }

  // Remove 'Bearer ' prefix if present
  const cleanToken = token.replace('Bearer ', '');
  return isTokenExpired(cleanToken);
}

/**
 * Validates a token and handles expiration
 * @param token - The JWT token to validate
 * @param onExpired - Callback function to execute when token is expired
 * @returns True if token is valid, false if expired
 */
export function validateToken(token: string, onExpired?: () => void): boolean {
  if (isTokenExpired(token)) {
    console.log('JWT token has expired.');
    if (onExpired) {
      onExpired();
    }
    return false;
  } else {
    console.log('JWT token is still valid.');
    return true;
  }
}

/**
 * Gets the user ID from a JWT token
 * @param token - The JWT token
 * @returns The user ID or null if not found
 */
export function getUserIdFromToken(token: string): string | null {
  const decodedToken = decodeJwt(token);
  return decodedToken?.sub || null;
}

/**
 * Gets the expiration time from a JWT token
 * @param token - The JWT token
 * @returns The expiration timestamp or null if not found
 */
export function getTokenExpiration(token: string): number | null {
  const decodedToken = decodeJwt(token);
  return decodedToken?.exp || null;
}
