// app/api/auth/reset-password/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import {connectToDatabase } from "@/app/lib/db";
import bcrypt from "bcrypt";

const PWD_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

export async function POST(req: Request) {
  const { email, otp, newPassword } = await req.json();
  if (!email || !otp || !newPassword) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (String(newPassword).length < 6) {
    return NextResponse.json({ error: "Password too short" }, { status: 400 });
  }

  const db = await connectToDatabase();
  const users = db.collection("users");
  const user = await users.findOne({ email });
  if (!user?.resetToken || !user.resetExpires) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (Date.now() > user.resetExpires) {
    return NextResponse.json({ error: "OTP expired" }, { status: 400 });
  }

  const ok = await bcrypt.compare(otp, user.resetToken);
  if (!ok) return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });

  const hashedPassword = await bcrypt.hash(String(newPassword), PWD_SALT_ROUNDS);

  await users.updateOne(
    { _id: user._id },
    { $set: { password: hashedPassword }, $unset: { resetToken: "", resetExpires: "" } }
  );

  return NextResponse.json({ message: "Password reset successful" });
}
