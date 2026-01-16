import React, { useState } from "react";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import imageCompression from "browser-image-compression";

// Khởi tạo Client dùng chung để tăng tốc kết nối
const s3Config = {
  region: "auto",
  endpoint: "https://0228e87750d83cdb13f72b6d162a3de4.r2.cloudflarestorage.com",
  forcePathStyle: true,
  credentials: {
    accessKeyId: "0f8cf3cc490d1458bb40d7a428a29571",
    secretAccessKey:
      "e8227e51b32b217f3b717d06870851a52bcac969ba7a014d5c8593a6525fd209",
  },
};
const s3Client = new S3Client(s3Config);

const ImageCDNCloud = ({ onUploadSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = null;

    try {
      setLoading(true);

      // Tối ưu: Thêm maxWidthOrHeight giúp nén ảnh lớn (nhiều MB) cực nhanh
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920, // Giữ độ nét Full HD nhưng xử lý nhanh hơn
        useWebWorker: true,
        initialQuality: 0.8,
      };
      const compressedFile = await imageCompression(file, options);

      await uploadToR2(compressedFile);
    } catch (err) {
      console.error("❌ Lỗi upload:", err);
    } finally {
      setLoading(false);
    }
  };

  const uploadToR2 = async (file) => {
    const fileKey = `uploads/${file.name}`;
    const arrayBuffer = await file.arrayBuffer();

    const command = new PutObjectCommand({
      Bucket: "uploads",
      Key: fileKey,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type,
    });

    try {
      await s3Client.send(command);
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
      {loading && <p>Đang xử lý và tải ảnh lên...</p>}
    </div>
  );
};

export default ImageCDNCloud;

// Hàm export thứ 2 giữ nguyên cấu trúc cho các mục đích sử dụng khác của bạn
export async function uploadImageToR2(file, filename = null) {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920, // Tối ưu tốc độ cho ảnh dung lượng lớn
    useWebWorker: true,
  };
  const compressedFile = await imageCompression(file, options);

  const ext = filename ? filename.split(".").pop() : "png";
  const fileKey = `uploads/${Date.now()}.${ext}`;

  const arrayBuffer = await compressedFile.arrayBuffer();

  const command = new PutObjectCommand({
    Bucket: "uploads",
    Key: fileKey,
    Body: new Uint8Array(arrayBuffer),
    ContentType: compressedFile.type || "image/png",
  });

  await s3Client.send(command);

  return `https://cdn.myvietnamtour.vn/${fileKey}`;
}
