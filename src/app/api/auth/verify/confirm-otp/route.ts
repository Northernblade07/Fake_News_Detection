// app/api/auth/verify/confirm-otp/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const { email, otp } = await req.json();
  if (!email || !otp) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const db = await connectToDatabase();
  const users = db.collection("users");
  const user = await users.findOne({ email });
  if (!user?.otp || !user.otpExpires) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (Date.now() > user.otpExpires) {
    return NextResponse.json({ error: "OTP expired" }, { status: 400 });
  }

  const ok = await bcrypt.compare(otp, user.otp);
  if (!ok) return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });

  await users.updateOne(
    { _id: user._id },
    { $set: { verified: true }, $unset: { otp: "", otpExpires: "" } }
  );

  return NextResponse.json({ message: "Account verified" });
}
