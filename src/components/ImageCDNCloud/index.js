import React, { useState } from "react";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import imageCompression from "browser-image-compression";

const ImageCDNCloud = ({ onUploadSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = null;

    try {
      setLoading(true);

      // Bước 1: Nén ảnh nhưng giữ nguyên định dạng gốc
      const options = {
        maxSizeMB: 1,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      // Bước 2: Upload file đã nén lên Cloudflare R2
      await uploadToR2(compressedFile);
    } catch (err) {
      console.error("❌ Lỗi upload:", err);
    } finally {
      setLoading(false);
    }
  };

  const uploadToR2 = async (file) => {
    const s3 = new S3Client({
      region: "auto",
      endpoint:
        "https://0228e87750d83cdb13f72b6d162a3de4.r2.cloudflarestorage.com",
      forcePathStyle: true,
      credentials: {
        accessKeyId: "0f8cf3cc490d1458bb40d7a428a29571",
        secretAccessKey:
          "e8227e51b32b217f3b717d06870851a52bcac969ba7a014d5c8593a6525fd209",
      },
    });

    const fileKey = `uploads/${file.name}`; // ✅ giữ nguyên tên gốc

    // Đọc file thành array buffer rồi convert sang Uint8Array để SDK nhận đúng
    const arrayBuffer = await file.arrayBuffer();

    const command = new PutObjectCommand({
      Bucket: "uploads",
      Key: fileKey,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type,
    });

    try {
      await s3.send(command);
      const fileUrl = `https://cdn.myvietnamtour.vn/${fileKey}`;
      if (onUploadSuccess) onUploadSuccess(fileUrl);
    } catch (err) {
      console.error("❌ Lỗi upload lên R2:", err);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={loading}
      />
      {loading && <p>Đang tải ảnh...</p>}
    </div>
  );
};

export default ImageCDNCloud;

export async function uploadImageToR2(file, filename = null) {
  // Nén ảnh giữ định dạng
  const options = { maxSizeMB: 1, useWebWorker: true };
  const compressedFile = await imageCompression(file, options);

  // Lấy extension từ filename nếu có, hoặc mặc định png
  const ext = filename ? filename.split(".").pop() : "png";
  const fileKey = `uploads/${Date.now()}.${ext}`;

  // Cấu hình S3 client cho Cloudflare R2
  const s3 = new S3Client({
    region: "auto", // hoặc "" nếu "auto" lỗi
    endpoint:
      "https://0228e87750d83cdb13f72b6d162a3de4.r2.cloudflarestorage.com",
    forcePathStyle: true,
    credentials: {
      accessKeyId: "0f8cf3cc490d1458bb40d7a428a29571",
      secretAccessKey:
        "e8227e51b32b217f3b717d06870851a52bcac969ba7a014d5c8593a6525fd209",
    },
  });

  const arrayBuffer = await compressedFile.arrayBuffer();

  const command = new PutObjectCommand({
    Bucket: "uploads",
    Key: fileKey,
    Body: new Uint8Array(arrayBuffer),
    ContentType: compressedFile.type || "image/png",
  });

  await s3.send(command);

  return `https://cdn.myvietnamtour.vn/${fileKey}`;
}
