import { connectToDatabase } from "@/app/lib/db";
import { auth } from "../../../../auth";
import { NextResponse } from "next/server";
import User from "@/app/model/user";

export async function GET() {
    await connectToDatabase();

    const session = await auth();
    if(!session?.user?.id) return NextResponse.json({error:"not authenticated "},{status:401});
    const userId = session?.user?.id;
    if(!userId) return NextResponse.json({error:"userId missing"},{status:404});

    const user = await User.findById(userId).select("-password -otp -resetToken").lean();

    if(!user) return NextResponse.json({error:"user not found"},{status:404});
    return NextResponse.json(user);
}