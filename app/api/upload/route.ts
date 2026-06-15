import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";


export async function POST(req: NextRequest) {

    try {

        const data = await req.formData();
        const file = data.get('file') as File;

        if (!file) {
            return NextResponse.json({ message: 'File not found' }, { status: 400 })
        }


        const byte = await file.arrayBuffer();
        const buffer = Buffer.from(byte);

        const result: any = await new Promise((resolve, reject) => {

            cloudinary.uploader.upload_stream(
                {
                    folder: 'ecommerce',
                }, (error, result) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(result);
                    }
                }
            )

                .end(buffer);
        })

        return NextResponse.json({
            success: true,
            imageUrl: result.secure_url
        })

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Image not uploaded' }, { status: 500 })
    }
}