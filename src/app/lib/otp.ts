// lib/otp.ts
import bcrypt from "bcryptjs";

// ===== Config =====
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
const OTP_LENGTH = Number(process.env.OTP_LENGTH ?? 6);
const OTP_EXP_MIN = Number(process.env.OTP_EXPIRY_MINUTES ?? 10);

// ===== Generate a numeric OTP =====
export function generateOTP(length = OTP_LENGTH): string {
  const base = 10 ** (length - 1);
  return Math.floor(base + Math.random() * 9 * base).toString();
}

// ===== Hash OTP =====
export async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, SALT_ROUNDS);
}

// ===== Verify OTP against hashed value =====
export async function verifyOTP(otp: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(otp, hashed);
}

// ===== Calculate expiry timestamp (ms since epoch) =====
export function otpExpiryTimestamp(expMinutes = OTP_EXP_MIN): number {
  return Date.now() + expMinutes * 60 * 1000;
}
