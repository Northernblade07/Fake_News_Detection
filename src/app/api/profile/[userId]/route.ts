import { NextRequest , NextResponse } from "next/server";
import User from "@/app/model/user";
import { connectToDatabase } from "@/app/lib/db";

export async function GET(req : NextRequest , {params}:{params:{userId:string}}) {
    await connectToDatabase();

    // const session = await auth();
    // if(!session?.user?.id) return NextResponse.json({error : "Not authenticated"});
    const {userId} = params;
    // const url = new URL(req.url);
    // const userId = url.searchParams.get("userId");
    if(!userId) return NextResponse.json({error : "Missing userId"} , {status : 400});

    // if(session.user.id !== userId) return NextResponse.json({error : "forbidden"},{status : 403});

    const user = await User.findById(userId).select("-password -otp -resetToken").lean();
    if(!user) return NextResponse.json({error:"User Not found"},{status:404})

        return NextResponse.json(user);
}