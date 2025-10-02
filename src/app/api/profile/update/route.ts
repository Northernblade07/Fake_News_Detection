import { connectToDatabase } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import User from "@/app/model/user";

export async function PATCH(req : NextRequest) {
     await connectToDatabase();

     const session = await auth();

     if(!session?.user?.id) return NextResponse.json({error:"Not authenticated"},{status : 401});

     const body = await req.json();
     const {name , phone , prefernce} = body;

     const user = await User.findById(session.user.id);
     if(!user) return NextResponse.json({error:"user not found"},{status : 404});

     if(name !== undefined) user.name = name.trim();
     if(phone !==undefined) user.phonne = phone.trim();
     if(prefernce !==undefined) user.prefernce = {...user.prefernce , ...prefernce};

     await user.save();

     return NextResponse.json({message :" profile updated "} , {status : 200});

}