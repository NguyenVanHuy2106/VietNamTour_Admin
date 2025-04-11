import React from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../config/firebaseConfig";
import imageCompression from "browser-image-compression";

const ImageUploader = ({ onUploadSuccess }) => {
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 👉 Reset lại input để tránh upload lại file cũ
    e.target.value = null;

    try {
      // 👉 Bước 1: Nén ảnh trước khi upload
      const options = {
        maxSizeMB: 1, // Tối đa dung lượng 1MB sau nén
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      // 👉 Bước 2: Convert ảnh nén sang WebP (giữ nguyên size gốc, không resize)
      const webpFile = await convertToWebP(compressedFile);

      // 👉 Bước 3: Upload ảnh WebP lên Firebase Storage
      const storageRef = ref(storage, `images/${Date.now()}.webp`);
      await uploadBytes(storageRef, webpFile);

      // 👉 Bước 4: Lấy URL của ảnh đã upload
      const url = await getDownloadURL(storageRef);
      if (onUploadSuccess) {
        onUploadSuccess(url); // Trả link ảnh về để lưu vào DB
      }
    } catch (err) {
      console.error("❌ Lỗi upload:", err);
    }
  };

  // ✅ Hàm chuyển đổi sang WebP (không resize, chất lượng 0.95)
  const convertToWebP = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, img.width, img.height);

          canvas.toBlob(
            (blob) => {
              const webpFile = new File([blob], `${Date.now()}.webp`, {
                type: "image/webp",
              });
              resolve(webpFile);
            },
            "image/webp",
            0.95 // Chất lượng cao hơn
          );
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
    </div>
  );
};

export default ImageUploader;
