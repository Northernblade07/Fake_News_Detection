// app/api/auth/verify/confirm-otp/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/app/lib/db";
import User from "@/app/model/user";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email }).select("+otp +otpExpires");
    if (!user || !user.otp || !user.otpExpires) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Check OTP expiry
    if (Date.now() > user.otpExpires.getTime()) {
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    // Compare OTP
    const ok = await bcrypt.compare(otp, user.otp);
    if (!ok) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Update user: verified and remove OTP fields
    user.verified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpRequestCount = 0;
    user.lastOtpRequestAt = undefined;

    await user.save();

    return NextResponse.json({ message: "Account verified successfully" }, { status: 200 });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
