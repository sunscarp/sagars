import { NextRequest, NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

function withTransform(url: string, transform: string) {
  return url.replace("/upload/", `/upload/${transform}/`);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const folder = (form.get("folder") as string) || "uploads";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          format: "webp",
          quality: "auto",
        },
        (err, res) =>
          err || !res ? reject(err || new Error("Upload failed")) : resolve(res)
      );
      stream.end(buffer);
    });

    const url = result.secure_url as string;

    return NextResponse.json({
      url: withTransform(url, "c_limit,w_1600,q_auto,f_auto"),
      mediumUrl: withTransform(url, "c_limit,w_800,q_auto,f_auto"),
      thumbUrl: withTransform(url, "c_limit,w_300,q_auto,f_auto"),
      publicId: result.public_id,
    });
  } catch (e: any) {
    console.error("Cloudinary upload error", e);
    return NextResponse.json(
      { error: e?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
