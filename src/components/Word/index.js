import React, { useRef, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { uploadImageToR2 } from "../ImageCDNCloud";

export default function Word({ onSave, value = "" }) {
  const editorRef = useRef(null);

  // const handleImageUpload = async (blobInfo, success, failure) => {
  //   try {
  //     const file = blobInfo.blob();
  //     const filename = blobInfo.filename();

  //     const url = await uploadImageToR2(file, filename);
  //     success({
  //       location: String(url),
  //     });
  //   } catch (error) {
  //     console.error("Lỗi upload ảnh:", error);
  //     failure("Lỗi upload ảnh: " + error.message);
  //   }
  // };

  // Word.js

  const handleImageUpload = async (blobInfo) => {
    try {
      const file = blobInfo.blob();
      const filename = blobInfo.filename();

      // Gọi hàm upload của bạn
      const url = await uploadImageToR2(file, filename);

      // QUAN TRỌNG: Trả về trực tiếp chuỗi URL
      // TinyMCE sẽ tự động đưa URL này vào thuộc tính 'src' của thẻ <img>
      return String(url);
    } catch (error) {
      console.error("Lỗi upload ảnh:", error);
      // Nếu có lỗi, quăng lỗi để TinyMCE bắt được và hiển thị thông báo
      throw new Error("Lỗi upload ảnh: " + error.message);
    }
  };

  const handleSave = () => {
    if (editorRef.current) {
      const content = editorRef.current.getContent();
      onSave(content);
    }
  };
  useEffect(() => {
    if (editorRef.current && value) {
      editorRef.current.setContent(value);
    }
  }, [value]);

  return (
    <div>
      <Editor
        apiKey="y1v3jdizx18e0ahydvb32vhcojced77026zj3z626e8wy9h0"
        onInit={(evt, editor) => (editorRef.current = editor)}
        initialValue={value}
        init={{
          plugins: [
            "autoresize",
            "anchor",
            "autolink",
            "charmap",
            "codesample",
            "emoticons",
            "image",
            "link",
            "lists",
            "media",
            "searchreplace",
            "table",
            "visualblocks",
            "wordcount",
          ],
          toolbar:
            "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | alignleft aligncenter alignright | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat",
          image_class_list: [
            { title: "Align Left", value: "align-left" },
            { title: "Align Center", value: "align-center" },
            { title: "Align Right", value: "align-right" },
          ],
          object_resizing: true,
          image_advtab: true,
          file_picker_types: "image",
          images_upload_handler: handleImageUpload,
          drag_drop: true,
          image_resize: true,
          image_caption: true,
          image_uploadtab: true,
          min_height: 300,
          autoresize_bottom_margin: 10,
          powerpaste_allow_local_images: true,
          powerpaste_word_import: "merge",
          content_style: `
              img {
              max-width: none;
              height: auto;
              }
          `,

          // content_style: `
          //   ol {
          //     counter-reset: item;
          //     list-style-type: none;
          //     padding-left: 1.5em;
          //   }
          //   ol li {
          //     display: block;
          //     position: relative;
          //   }
          //   ol li:before {
          //     content: counters(item, ".") ". ";
          //     counter-increment: item;
          //     position: absolute;
          //     left: -1.5em;
          //   }
          // `,
        }}
        initialValue="Welcome to TinyMCE!"
      />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleSave}
          style={{
            marginTop: "1rem",
            border: "0px",
            paddingLeft: 20,
            paddingRight: 20,
            paddingBottom: 5,
            paddingTop: 5,
          }}
        >
          Lưu
        </button>
      </div>
    </div>
  );
}
