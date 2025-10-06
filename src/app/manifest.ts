import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return{
        name:'SatyaShield',
        short_name:"Satya",
        description:"A PWA Fake news detection application using ai",
        start_url:"/",
        display:"standalone",
        background_color:"#0f712a",
        theme_color:"#0f172a",
        icons:[
            {
                src:"/icons-192x192.png" , sizes:"192x192" , type:"image/png",
            },
            {
                src:"/icons-512x512.png" , sizes:"512x512" , type:"image/png",
            }
        ]

    }
}