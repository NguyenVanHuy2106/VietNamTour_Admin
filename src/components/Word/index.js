import React, { useEffect, useRef, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { uploadImageToR2 } from "../ImageCDNCloud";
import "./index.css";

export default function Word({ onChange, value = "" }) {
  const editorRef = useRef(null);

  const [stats, setStats] = useState({
    words: 0,
    chars: 0,
    sizeKB: "0.0",
  });

  /* =====================================================
     UPLOAD IMAGE TO R2
  ===================================================== */
  const handleImageUpload = async (blobInfo) => {
    try {
      const file = blobInfo.blob();
      const filename = blobInfo.filename();

      const url = await uploadImageToR2(file, filename);

      return String(url);
    } catch (error) {
      console.error("Lỗi upload ảnh:", error);

      throw new Error(
        "Không thể tải ảnh lên. Vui lòng thử lại: " + error.message,
      );
    }
  };

  /* =====================================================
     CALCULATE CONTENT STATS
  ===================================================== */
  const updateStats = (content, editor = null) => {
    try {
      let text = "";

      if (editor) {
        text = editor.getContent({
          format: "text",
        });
      } else {
        const temp = document.createElement("div");

        temp.innerHTML = content || "";

        text = temp.textContent || temp.innerText || "";
      }

      const cleanText = text.trim();

      const words = cleanText
        ? cleanText.split(/\s+/).filter(Boolean).length
        : 0;

      const chars = cleanText.length;

      const sizeBytes = new Blob([content || ""]).size;

      const sizeKB = (sizeBytes / 1024).toFixed(1);

      setStats({
        words,
        chars,
        sizeKB,
      });
    } catch (error) {
      console.error("Không thể tính thống kê nội dung:", error);
    }
  };

  /* =====================================================
     SYNC VALUE FROM PARENT
  ===================================================== */
  useEffect(() => {
    if (!editorRef.current) {
      updateStats(value);
      return;
    }

    const currentContent = editorRef.current.getContent();

    if ((value || "") !== currentContent) {
      editorRef.current.setContent(value || "");
    }

    updateStats(value, editorRef.current);
  }, [value]);

  /* =====================================================
     HANDLE EDITOR CHANGE
  ===================================================== */
  const handleEditorChange = (content, editor) => {
    updateStats(content, editor);

    if (onChange) {
      onChange(content);
    }
  };

  return (
    <div className="blog-editor-wrapper">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="blog-editor-header">
        <div>
          <div className="blog-editor-title">Nội dung bài viết</div>

          <div className="blog-editor-description">
            Soạn nội dung hiển thị chi tiết trên website
          </div>
        </div>

        <div className="blog-editor-status">
          <span className="blog-editor-status-dot"></span>
          Tự động ghi nhận
        </div>
      </div>

      {/* =====================================================
          EDITOR
      ===================================================== */}
      <div className="blog-editor-content">
        <Editor
          apiKey="y1v3jdizx18e0ahydvb32vhcojced77026zj3z626e8wy9h0"
          onInit={(evt, editor) => {
            editorRef.current = editor;

            updateStats(editor.getContent(), editor);
          }}
          initialValue={value || ""}
          onEditorChange={handleEditorChange}
          init={{
            /* =================================================
               BASIC
            ================================================= */
            height: 620,
            min_height: 520,

            menubar: false,

            branding: false,

            promotion: false,

            resize: true,

            statusbar: true,

            placeholder: "Bắt đầu nhập nội dung bài viết tại đây...",

            browser_spellcheck: true,

            contextmenu: false,

            toolbar_mode: "wrap",

            /* =================================================
               PLUGINS
            ================================================= */
            plugins: [
              "advlist",
              "anchor",
              "autolink",
              "autosave",
              "charmap",
              "code",
              "codesample",
              "emoticons",
              "fullscreen",
              "image",
              "link",
              "lists",
              "media",
              "preview",
              "searchreplace",
              "table",
              "visualblocks",
              "wordcount",
            ],

            /* =================================================
               TOOLBAR
            ================================================= */
            toolbar: [
              "undo redo | blocks | fontfamily fontsize",
              "bold italic underline strikethrough | forecolor backcolor | removeformat",
              "alignleft aligncenter alignright alignjustify | bullist numlist | outdent indent",
              "link image media table | blockquote",
              "searchreplace | visualblocks | preview fullscreen | code",
            ].join(" | "),

            /* =================================================
               FORMAT
            ================================================= */
            block_formats:
              "Đoạn văn=p;" +
              "Tiêu đề 1=h1;" +
              "Tiêu đề 2=h2;" +
              "Tiêu đề 3=h3;" +
              "Tiêu đề 4=h4;" +
              "Trích dẫn=blockquote",

            font_family_formats:
              "Arial=Arial,Helvetica,sans-serif;" +
              "Roboto=Roboto,Arial,sans-serif;" +
              "Times New Roman=Times New Roman,Times,serif;" +
              "Georgia=Georgia,serif;" +
              "Tahoma=Tahoma,Arial,sans-serif;" +
              "Verdana=Verdana,Arial,sans-serif",

            font_size_formats:
              "12px 13px 14px 15px 16px 18px 20px 22px 24px 28px 32px 36px 40px",

            /* =================================================
               IMAGE
            ================================================= */
            image_title: true,

            automatic_uploads: true,

            file_picker_types: "image",

            images_upload_handler: handleImageUpload,

            /*
              QUAN TRỌNG:
              Không cho TinyMCE lưu ảnh dạng base64 trực tiếp
              vào HTML vì có thể làm content cực nặng.
            */
            paste_data_images: false,

            image_advtab: true,

            image_caption: true,

            object_resizing: true,

            image_uploadtab: true,

            image_class_list: [
              {
                title: "Mặc định",
                value: "",
              },
              {
                title: "Căn trái",
                value: "align-left",
              },
              {
                title: "Căn giữa",
                value: "align-center",
              },
              {
                title: "Căn phải",
                value: "align-right",
              },
              {
                title: "Ảnh bo góc",
                value: "rounded-image",
              },
            ],

            /* =================================================
               LINK
            ================================================= */
            link_default_target: "_blank",

            link_assume_external_targets: true,

            /* =================================================
               TABLE
            ================================================= */
            table_default_attributes: {
              border: "1",
            },

            table_default_styles: {
              width: "100%",
              borderCollapse: "collapse",
            },

            /* =================================================
               AUTOSAVE
            ================================================= */
            autosave_interval: "10s",

            autosave_retention: "30m",

            autosave_restore_when_empty: false,

            /* =================================================
               CONTENT STYLE
            ================================================= */
            content_style: `
              body {
                font-family: Arial, Helvetica, sans-serif;
                font-size: 16px;
                line-height: 1.75;
                color: #333333;

                padding: 24px 28px;

                max-width: 100%;

                background: #ffffff;
              }

              p {
                margin-top: 0;
                margin-bottom: 14px;
              }

              h1 {
                font-size: 32px;
                line-height: 1.3;

                margin: 30px 0 16px;

                font-weight: 700;

                color: #172b4d;
              }

              h2 {
                font-size: 26px;
                line-height: 1.35;

                margin: 28px 0 14px;

                font-weight: 700;

                color: #172b4d;
              }

              h3 {
                font-size: 21px;
                line-height: 1.4;

                margin: 24px 0 12px;

                font-weight: 700;

                color: #172b4d;
              }

              h4 {
                font-size: 18px;

                margin: 22px 0 10px;

                font-weight: 700;

                color: #344054;
              }

              img {
                max-width: 100%;

                height: auto;

                display: block;
              }

              img.align-left {
                margin: 15px auto 15px 0;
              }

              img.align-center {
                margin: 18px auto;
              }

              img.align-right {
                margin: 15px 0 15px auto;
              }

              img.rounded-image {
                border-radius: 12px;
              }

              figure.image {
                margin: 24px auto;

                max-width: 100%;
              }

              figure.image img {
                max-width: 100%;
                height: auto;
              }

              figure.image figcaption {
                margin-top: 8px;

                color: #667085;

                font-size: 13px;

                text-align: center;
              }

              blockquote {
                margin: 22px 0;

                padding: 16px 20px;

                border-left: 4px solid #1d61ad;

                background: #f5f9ff;

                color: #475467;
              }

              ul,
              ol {
                margin-top: 10px;
                margin-bottom: 18px;

                padding-left: 30px;
              }

              li {
                margin-bottom: 7px;
              }

              a {
                color: #1d61ad;

                text-decoration: underline;
              }

              table {
                width: 100%;

                margin: 22px 0;

                border-collapse: collapse;
              }

              table th,
              table td {
                padding: 10px 12px;

                border: 1px solid #d0d5dd;

                vertical-align: top;
              }

              table th {
                background: #f2f4f7;

                font-weight: 700;
              }

              code {
                padding: 2px 5px;

                border-radius: 4px;

                background: #f2f4f7;

                color: #b42318;
              }

              pre {
                padding: 16px;

                border-radius: 8px;

                overflow-x: auto;

                background: #101828;

                color: #ffffff;
              }
            `,
          }}
        />
      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}
      <div className="blog-editor-footer">
        <div className="blog-editor-tip">
          <strong>Mẹo:</strong> Dùng <strong>Tiêu đề 2</strong> cho mục lớn và{" "}
          <strong>Tiêu đề 3</strong> cho mục con để bài viết dễ đọc và tốt hơn
          cho SEO.
        </div>

        <div className="blog-editor-stats">
          <span>
            <strong>{stats.words.toLocaleString()}</strong> từ
          </span>

          <span>
            <strong>{stats.chars.toLocaleString()}</strong> ký tự
          </span>

          <span
            className={
              Number(stats.sizeKB) > 500 ? "blog-editor-size-warning" : ""
            }
          >
            <strong>{stats.sizeKB}</strong> KB
          </span>
        </div>
      </div>
    </div>
  );
}
