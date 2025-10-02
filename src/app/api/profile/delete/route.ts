import { connectToDatabase } from "@/app/lib/db";
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import NewsDetection from "@/app/model/News";
import User from "@/app/model/user";

export async function DELETE() {
    
    await connectToDatabase();
     const session = await auth();
     if (session?.user?.id) return NextResponse.json({error:"User not authenticated"},{status : 401});
     const userId = session?.user?.id;
     await NewsDetection.deleteMany({user:userId});
     await User.findByIdAndDelete(userId);
     
     return NextResponse.json({message:"user account deleted"});
    }