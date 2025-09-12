// app/api/auth/register/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import User, { IUser } from "@/app/models/user";
import { generateOTP, hashOTP, otpExpiryTimestamp } from "@/app/lib/otp";
import { sendMail, otpEmailHtml } from "@/app/lib/mailer";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/app/lib/db";

const PWD_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

export async function POST(req: Request) {
  try {
     await connectToDatabase();
    const body = await req.json();
    const email = String(body?.email ?? "").toLowerCase().trim();
    const password = String(body?.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password too short" }, { status: 400 });
    }

    // Check if user already exists
    const existing = await User.findOne({ email }).collation({ locale: "en", strength: 2 });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    // Hash password & generate OTP
    const hashedPassword = await bcrypt.hash(password, PWD_ROUNDS);
    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);
    const otpExpires = new Date(otpExpiryTimestamp());

    // Create user document
    const user:IUser = new User({
      email,
      password: hashedPassword,
      verified: false,
      otp: hashedOtp,
      otpExpires,
      otpRequestCount: 1,
      lastOtpRequestAt: new Date(),
    });

    await user.save();

    // Send verification email
    await sendMail({
      to: email,
      subject: "Verify your account",
      html: otpEmailHtml("verify", otp),
      text: `Your OTP is: ${otp}`,
    });

    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({ message: "OTP sent", otp }, { status: 200 });
    }
    return NextResponse.json({ message: "OTP sent" }, { status: 200 });
  } catch (e: unknown) {
    console.error("Register error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
