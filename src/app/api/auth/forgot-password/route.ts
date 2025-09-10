// app/api/auth/forgot-password/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import { Resend } from "resend";
import bcrypt from "bcrypt";

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const MAIL_FROM = process.env.MAIL_FROM!;
const OTP_EXP_MIN = Number(process.env.OTP_EXPIRY_MINUTES ?? 10);
const OTP_LENGTH = 6;
const OTP_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

const resend = new Resend(RESEND_API_KEY);

function generateOTP(): string {
  const base = 10 ** (OTP_LENGTH - 1);
  return Math.floor(base + Math.random() * (9 * base)).toString();
}

function otpExpiryMs(): number {
  return Date.now() + OTP_EXP_MIN * 60 * 1000;
}

function otpHtml(code: string) {
  return `
    <div style="font-family:Arial,sans-serif">
      <h2>Reset your password</h2>
      <p>Your one-time code is:</p>
      <p style="font-size:22px;font-weight:700;letter-spacing:3px">${code}</p>
      <p>This code expires in ${OTP_EXP_MIN} minutes.</p>
    </div>
  `;
}

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const db = await connectToDatabase();
  const users = db.collection("users");
  const user = await users.findOne({ email });

  // Always respond success to prevent enumeration
  if (!user) return NextResponse.json({ message: "If the account exists, an email has been sent" });

  const code = generateOTP();
  const hashed = await bcrypt.hash(code, OTP_SALT_ROUNDS);

  await users.updateOne(
    { _id: user._id },
    { $set: { resetToken: hashed, resetExpires: otpExpiryMs() } }
  );

  const { error } = await resend.emails.send({
    from: MAIL_FROM,
    to: [email],
    subject: "Your password reset code",
    html: otpHtml(code),
  });
  // Still return neutral message even on email errors
  if (error) return NextResponse.json({ message: "If the account exists, an email has been sent" });

  return NextResponse.json({ message: "If the account exists, an email has been sent" });
}
