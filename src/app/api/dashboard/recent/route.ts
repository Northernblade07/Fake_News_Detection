import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { connectToDatabase } from "@/app/lib/db";
import DetectionLog, { IDetectionLog } from "@/app/model/detectionlog";
import NewsDetection, { INewsDetection } from "@/app/model/News";

export const dynamic = "force-dynamic";

interface PopulatedDetectionLog extends Omit<IDetectionLog , "news">{
    news: INewsDetection;
}

export async function GET(){
    try {
        const session = await auth();
        if(!session?.user?.id){
            return NextResponse.json({error:"unauthorised"},{status:401})
        }

        const userId = session.user.id;
        await connectToDatabase();

        const limit = 10;
        const logs = await DetectionLog.find({user:userId}).populate<{news:INewsDetection}>({
            path:"news",
            model:NewsDetection,
            select:"type textContent title status result createdAt"
        }).sort({createdAt:-1}).limit(limit).lean<PopulatedDetectionLog[]>();

        const jobs = logs.map((log)=>({
            id: log._id?.toString(),
            title:log.news.title||"untitled",
            textPreview:log.news.textContent? log.news.textContent.substring(0,50):undefined,
            sourceType: log.news.type || "text",
            confidence:log.result?.probability,
            submittedAt: log.createdAt?.toISOString(),
            verdict:log.result?.label || "unknown",

        }))
        return NextResponse.json(jobs);

    } catch (error) {
        console.log(error , "error at dashboard recent");
        return NextResponse.json({error:"failed to load recents"},{
            status:500
        })
    }
    
}