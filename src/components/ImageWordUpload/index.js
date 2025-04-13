import imageCompression from "browser-image-compression";
import { renderToStaticMarkup } from "react-dom/server";
import { CiImageOn } from "react-icons/ci"; // Import icon CiImageOn
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../config/firebaseConfig";
import { ButtonView } from "@ckeditor/ckeditor5-ui";

// Hàm thêm nút tải ảnh lên Firebase vào editor
export function addUploadFirebaseImageButton(editor) {
  const imageIcon = renderToStaticMarkup(<CiImageOn size={20} />); // Giữ icon CiImageOn

  editor.ui.componentFactory.add("uploadFirebaseImage", (locale) => {
    const view = new ButtonView(locale);

    view.set({
      label: "Tải ảnh lên Firebase",
      icon: imageIcon, // Sử dụng icon CiImageOn
      tooltip: true,
    });

    view.on("execute", async () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";

      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;

        try {
          const compressed = await compressImage(file);
          const webpFile = await convertToWebP(compressed);
          const imageUrl = await uploadToFirebase(webpFile);

          // ✅ Chèn ảnh vào editor
          editor.model.change((writer) => {
            const imageElement = writer.createElement("image", {
              src: imageUrl,
            });
            editor.model.insertContent(
              imageElement,
              editor.model.document.selection
            );
          });
        } catch (error) {
          console.error("❌ Upload lỗi:", error);
        }
      };

      input.click();
    });

    return view;
  });
}

// 👉 Hàm nén ảnh
async function compressImage(file) {
  return await imageCompression(file, {
    maxSizeMB: 1,
    useWebWorker: true,
  });
}

// 👉 Hàm chuyển ảnh sang WebP
function convertToWebP(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            const webpFile = new File([blob], `${Date.now()}.webp`, {
              type: "image/webp",
            });
            resolve(webpFile);
          },
          "image/webp",
          0.95
        );
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 👉 Hàm upload lên Firebase
async function uploadToFirebase(file) {
  const storageRef = ref(storage, `images/${Date.now()}.webp`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
}
