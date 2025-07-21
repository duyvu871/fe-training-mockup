/**
 * JWT Utilities - Token generation, verification, and management
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import dayjs from 'dayjs';

import { config } from '../config/environment';
import { JWTPayload, RefreshTokenPayload, TokenPair } from '../types/auth.types';
import { logger } from './logger';
import { UserRole } from '@/types/database.types';

/**
 * Generate access token
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  try {
    return jwt.sign(
      payload,
      config.jwt.secret as jwt.Secret,
      {
        expiresIn: config.jwt.expire
      } as SignOptions
    );
  } catch (error) {
    logger.error('Error generating access token', { error, payload: { userId: payload.userId } });
    throw new Error('Failed to generate access token');
  }
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
  try {
    return jwt.sign(
      payload,
      config.jwt.refreshSecret as jwt.Secret,
      {
        expiresIn: config.jwt.refreshExpire
      } as SignOptions
    );
  } catch (error) {
    logger.error('Error generating refresh token', { error, payload: { userId: payload.userId } });
    throw new Error('Failed to generate refresh token');
  }
}

/**
 * Generate token pair (access + refresh)
 */
export function generateTokenPair(userId: string, username: string, role: UserRole): TokenPair {
  try {
    const tokenId = `${userId}_${Date.now()}`;
    
    const accessToken = generateAccessToken({
      userId,
      username,
      role: role
    });
    
    const refreshToken = generateRefreshToken({
      userId,
      tokenId
    });

    // Calculate expiration times
    const accessTokenDecoded = jwt.decode(accessToken) as JWTPayload;
    const refreshTokenDecoded = jwt.decode(refreshToken) as RefreshTokenPayload;
    if (!accessTokenDecoded || !refreshTokenDecoded) {
      throw new Error('Failed to decode tokens');
    }
    return {
      accessToken,
      refreshToken,
      expiresIn: dayjs.unix(accessTokenDecoded.exp || new Date().getTime()).diff(dayjs(), 'second'),
      refreshExpiresIn: dayjs.unix(refreshTokenDecoded.exp || new Date().getTime()).diff(dayjs(), 'second')
    };
  } catch (error) {
    logger.error('Error generating token pair', { error, userId });
    throw new Error('Failed to generate token pair');
  }
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    } else {
      logger.error('Error verifying access token', { error });
      throw new Error('Failed to verify access token');
    }
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    } else {
      logger.error('Error verifying refresh token', { error });
      throw new Error('Failed to verify refresh token');
    }
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): any {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Error decoding token', { error });
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as JWTPayload | RefreshTokenPayload;
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}

/**
 * Get token expiration date
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload | RefreshTokenPayload;
    if (!decoded || !decoded.exp) {
      return null;
    }
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
}

/**
 * Get time until token expires (in seconds)
 */
export function getTimeUntilExpiry(token: string): number {
  try {
    const decoded = jwt.decode(token) as JWTPayload | RefreshTokenPayload;
    if (!decoded || !decoded.exp) {
      return 0;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    const timeLeft = decoded.exp - currentTime;
    return Math.max(0, timeLeft);
  } catch (error) {
    return 0;
  }
}

/**
 * Extract user ID from token
 */
export function extractUserIdFromToken(token: string): string | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload | RefreshTokenPayload;
    return decoded?.userId || null;
  } catch (error) {
    return null;
  }
}

/**
 * Create token blacklist entry (for logout)
 */
export function createTokenBlacklistEntry(token: string) {
  const decoded = jwt.decode(token) as JWTPayload | RefreshTokenPayload;
  if (!decoded) {
    throw new Error('Invalid token');
  }
  
  return {
    token,
    userId: decoded.userId,
    expiresAt: dayjs.unix(decoded.exp || new Date().getTime()).toDate(),
    blacklistedAt: dayjs().toDate()
  };
}

/**
 * JWT utilities for testing
 */
export const jwtTestUtils = {
  /**
   * Generate test token with custom payload
   */
  generateTestToken(payload: any, secret?: string, expiresIn?: string): string {
    return jwt.sign(
      payload,
      (secret || config.jwt.secret) as jwt.Secret,
      { expiresIn: expiresIn || '1h' } as SignOptions
    );
  },

  /**
   * Generate expired token for testing
   */
  generateExpiredToken(payload: any): string {
    return jwt.sign(
      { ...payload, exp: Math.floor(Date.now() / 1000) - 60 },
      config.jwt.secret
    );
  }
};
