import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

// ✅ Hàm lấy danh sách ảnh từ R2
export const FetchImages = async () => {
  try {
    const s3 = new S3Client({
      region: "auto",
      endpoint:
        "https://0228e87750d83cdb13f72b6d162a3de4.r2.cloudflarestorage.com",
      credentials: {
        accessKeyId: "0f8cf3cc490d1458bb40d7a428a29571",
        secretAccessKey:
          "e8227e51b32b217f3b717d06870851a52bcac969ba7a014d5c8593a6525fd209",
      },
    });

    const command = new ListObjectsV2Command({
      Bucket: "uploads",
      Prefix: "uploads/", // chỉ lấy file trong thư mục 'uploads/'
    });

    const data = await s3.send(command);

    const imageList = (data.Contents || []).map((item) => ({
      id: item.Key,
      name: item.Key.split("/").pop(),
      url: `https://images.vietnamluxtour.com/${item.Key}`, // domain proxy public
    }));

    return imageList;
  } catch (error) {
    console.error("❌ Lỗi fetch images from R2:", error);
    return [];
  }
};
