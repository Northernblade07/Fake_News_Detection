import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { connectToDatabase } from "@/app/lib/db";
import DetectionLog from "@/app/model/detectionlog";

export async function GET() {
    try {
        const session = await auth();
        if(!session?.user?.id){
            return NextResponse.json({error:"unauthorised"},{status:401});
        }

        await connectToDatabase();
        const userId = session.user.id;
        const [
            total ,
            fake, 
            real,
            unknown
        ] = await Promise.all([
            DetectionLog.countDocuments({user:userId}),
            DetectionLog.countDocuments({user:userId , "result.label":"fake"}),
            DetectionLog.countDocuments({user:userId , "result.label" : "real"}),
            DetectionLog.countDocuments({user:userId , "result.label" : "unknown"})
        ])

        return NextResponse.json({
            total,
            fake,
            real,
            unknown
        })
    } catch (error) {
        console.log(error , "dashboard stats");
        return NextResponse.json({error:"failed to fetch stats"}, {
            status:500
        })        
    }
}