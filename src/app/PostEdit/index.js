import React, { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Button,
  Toast,
  ToastContainer,
  Spinner,
  Badge,
} from "react-bootstrap";

import Form from "react-bootstrap/Form";

import {
  FiArrowLeft,
  FiSave,
  FiCheck,
  FiImage,
  FiFileText,
} from "react-icons/fi";

import { useLocation, useNavigate, useParams } from "react-router-dom";

import Word from "../../components/Word";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";
import ImageCDNCloud from "../../components/ImageCDNCloud";

import "./index.css";

const PostEdit = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /*
    Hỗ trợ cả 2 kiểu:

    navigate("/post/edit", {
      state: { postId: 25 }
    })

    hoặc route:
    /post/edit/:postId
  */

  const params = useParams();

  const postId =
    location.state?.postId ||
    location.state?.post_id ||
    params.postId ||
    params.id;

  const userId = localStorage.getItem("userId");

  /* =====================================================
     STATE
  ===================================================== */

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [successAlertOpen, setSuccessAlertOpen] = useState(false);

  const [alertMessage, setAlertMessage] = useState("");

  const [alertVariant, setAlertVariant] = useState("primary");

  const [dataTag, setDataTag] = useState([]);

  const [dataCategories, setDataCategories] = useState([]);

  const [selectedTags, setSelectedTags] = useState([]);

  const [blogData, setBlogData] = useState({
    post_id: "",
    title: "",
    slug: "",
    content: "",
    thumbnail_url: "",
    description: "",
    category_id: "",
    updated_by: userId,
    tag_ids: [],
  });

  /* =====================================================
     TOAST
  ===================================================== */

  const showToast = (variant, message) => {
    setAlertVariant(variant);
    setAlertMessage(message);
    setSuccessAlertOpen(true);
  };

  /* =====================================================
     LOAD TAG
  ===================================================== */

  const getTags = async () => {
    try {
      const response = await API.get("/tag/get");

      setDataTag(response.data.data || []);
    } catch (error) {
      console.error("Lỗi lấy tag:", error);
    }
  };

  /* =====================================================
     LOAD CATEGORY
  ===================================================== */

  const getCategories = async () => {
    try {
      const response = await API.get("/categories/get");

      setDataCategories(response.data.data || []);
    } catch (error) {
      console.error("Lỗi lấy danh mục:", error);
    }
  };

  /* =====================================================
     LOAD POST DETAIL
  ===================================================== */

  const getPostDetail = async () => {
    if (!postId) {
      showToast("danger", "Không tìm thấy ID bài viết.");

      setLoadingData(false);

      return;
    }

    try {
      setLoadingData(true);

      /*
        API ông đưa:

        GET http://localhost:3000/api/post/25

        Nếu APINoToken baseURL đã có /api
        thì sửa dòng này thành:

        API.get(`/post/${postId}`)
      */

      const response = await API.get(`/post/${postId}`);

      /*
        Tui viết flexible để hỗ trợ
        một số kiểu response thường gặp.

        Ví dụ:

        {
          data: {
            post: {...},
            tags: [...]
          }
        }

        hoặc:

        {
          data: {
            post_id: ...
          }
        }
      */

      const responseData = response.data?.data || {};

      const post = responseData.post || responseData.data || responseData;

      /*
        Hỗ trợ tags có thể trả:

        tags: [
          { tag_id: 1, tag_name: "..." }
        ]

        hoặc:
        tag_ids: [1,2,3]
      */

      let tagIds = [];

      if (Array.isArray(responseData.tag_ids)) {
        tagIds = responseData.tag_ids.map(Number);
      } else if (Array.isArray(post.tag_ids)) {
        tagIds = post.tag_ids.map(Number);
      } else if (Array.isArray(responseData.tags)) {
        tagIds = responseData.tags.map((tag) => Number(tag.tag_id ?? tag.id));
      } else if (Array.isArray(post.tags)) {
        tagIds = post.tags.map((tag) => Number(tag.tag_id ?? tag.id));
      }

      const categoryId = post.category_id ?? post.category?.category_id ?? "";

      setBlogData({
        post_id: post.post_id || postId,

        title: post.title || "",

        slug: post.slug || "",

        content: post.content || "",

        thumbnail_url: post.thumbnail_url || "",

        description: post.description || "",

        category_id: categoryId ? Number(categoryId) : "",

        updated_by: userId,

        tag_ids: tagIds,
      });

      setSelectedTags(tagIds);
    } catch (error) {
      console.error("Lỗi lấy chi tiết bài viết:", error);

      showToast(
        "danger",
        error?.response?.data?.message || "Không thể tải thông tin bài viết.",
      );
    } finally {
      setLoadingData(false);
    }
  };

  /* =====================================================
     INIT
  ===================================================== */

  useEffect(() => {
    getTags();
    getCategories();
    getPostDetail();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =====================================================
     HANDLE INPUT
  ===================================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    let newValue = value;

    if (name === "category_id") {
      newValue = value === "" ? "" : parseInt(value, 10);
    }

    /*
      KHÔNG tự generate slug khi sửa title.

      Lý do:
      Bài cũ có thể đang được Google index.
      Sửa tiêu đề không nên tự làm thay đổi URL.
    */

    setBlogData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  /* =====================================================
     CONTENT
  ===================================================== */

  const handleContentChange = (newContent) => {
    setBlogData((prev) => ({
      ...prev,
      content: newContent || "",
    }));
  };

  /* =====================================================
     TAG
  ===================================================== */

  const handleTagChange = (tagId) => {
    const normalizedId = Number(tagId);

    setSelectedTags((prevSelected) => {
      const exists = prevSelected.includes(normalizedId);

      const newSelectedTags = exists
        ? prevSelected.filter((id) => id !== normalizedId)
        : [...prevSelected, normalizedId];

      setBlogData((prev) => ({
        ...prev,
        tag_ids: newSelectedTags,
      }));

      return newSelectedTags;
    });
  };

  /* =====================================================
     THUMBNAIL
  ===================================================== */

  const handleUploadSuccess = (url) => {
    setBlogData((prev) => ({
      ...prev,
      thumbnail_url: url,
    }));
  };

  const handleRemoveThumbnail = () => {
    setBlogData((prev) => ({
      ...prev,
      thumbnail_url: "",
    }));
  };

  /* =====================================================
     HTML EMPTY CHECK
  ===================================================== */

  const isContentEmpty = (html) => {
    if (!html) return true;

    const text = html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, "")
      .trim();

    return text === "";
  };

  /* =====================================================
     COMPLETION
  ===================================================== */

  const completionData = useMemo(() => {
    const checks = [
      {
        label: "Tiêu đề bài viết",
        done: Boolean(blogData.title.trim()),
      },

      {
        label: "Danh mục",
        done: Boolean(blogData.category_id),
      },

      {
        label: "Nội dung chi tiết",
        done: !isContentEmpty(blogData.content),
      },

      {
        label: "Ảnh đại diện",
        done: Boolean(blogData.thumbnail_url),
      },

      {
        label: "Mô tả ngắn",
        done: Boolean(blogData.description.trim()),
      },

      {
        label: "Tags",
        done: selectedTags.length > 0,
      },
    ];

    const completed = checks.filter((item) => item.done).length;

    const percent = Math.round((completed / checks.length) * 100);

    return {
      checks,
      percent,
    };
  }, [blogData, selectedTags]);

  /* =====================================================
     UPDATE
  ===================================================== */

  const handleUpdatePost = async () => {
    if (!blogData.post_id) {
      showToast("danger", "Không xác định được bài viết cần cập nhật.");

      return;
    }

    if (!blogData.title.trim()) {
      showToast("danger", "Vui lòng nhập tiêu đề bài viết.");

      return;
    }

    if (!blogData.slug.trim()) {
      showToast("danger", "Vui lòng nhập đường dẫn bài viết.");

      return;
    }

    if (!blogData.category_id) {
      showToast("danger", "Vui lòng chọn danh mục.");

      return;
    }

    if (isContentEmpty(blogData.content)) {
      showToast("danger", "Vui lòng nhập nội dung bài viết.");

      return;
    }

    /*
      API createPost hiện tại của ông
      đang bắt các field này bắt buộc.

      Nên trang Edit cũng check giống rule đó.
    */

    if (!blogData.description.trim()) {
      showToast("danger", "Vui lòng nhập mô tả ngắn.");

      return;
    }

    if (!blogData.thumbnail_url) {
      showToast("danger", "Vui lòng chọn ảnh đại diện.");

      return;
    }

    if (selectedTags.length === 0) {
      showToast("danger", "Vui lòng chọn ít nhất một tag.");

      return;
    }

    try {
      setLoading(true);

      const payload = {
        post_id: blogData.post_id,

        title: blogData.title.trim(),

        slug: blogData.slug.trim(),

        content: blogData.content,

        thumbnail_url: blogData.thumbnail_url,

        description: blogData.description.trim(),

        updated_by: userId,

        category_id: Number(blogData.category_id),

        tag_ids: selectedTags.map(Number),
      };

      const response = await APIToken.post("/post/update", payload);

      if (response.status === 200) {
        showToast("success", "Cập nhật bài viết thành công! 🎉");

        /*
          Sau 800ms quay về danh sách.
          Ông đổi route này nếu list bài
          của ông không phải /post
        */

        setTimeout(() => {
          navigate("/guide-travel-list");
        }, 800);
      }
    } catch (error) {
      console.error("Lỗi cập nhật bài viết:", error);

      showToast(
        "danger",
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Không thể cập nhật bài viết.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loadingData) {
    return (
      <div className="post-edit-loading-page">
        <Spinner animation="border" />

        <span>Đang tải thông tin bài viết...</span>
      </div>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="post-edit-container">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="post-edit-page-header">
        <div className="post-edit-header-left">
          <button
            type="button"
            className="post-edit-back-btn"
            onClick={() => navigate("/guide-travel-list")}
          >
            <FiArrowLeft />
          </button>

          <div>
            <div className="post-edit-title-row">
              <h2>Chỉnh sửa bài viết</h2>

              {blogData.post_id && (
                <Badge bg="light" text="dark" className="post-edit-id-badge">
                  ID #{blogData.post_id}
                </Badge>
              )}

              <Badge
                bg={completionData.percent === 100 ? "success" : "primary"}
                className="post-edit-completion-badge"
              >
                Hoàn thiện {completionData.percent}%
              </Badge>
            </div>

            <p>
              Chỉnh sửa nội dung, danh mục, hình ảnh và thông tin SEO của bài
              viết.
            </p>
          </div>
        </div>
      </div>

      <Row className="g-4">
        {/* =================================================
            LEFT
        ================================================= */}

        <Col xl={8} lg={8}>
          {/* ===============================================
              BASIC CONTENT
          =============================================== */}

          <div className="post-edit-card">
            <div className="post-edit-card-header">
              <div className="post-edit-card-header-icon">
                <FiFileText />
              </div>

              <div>
                <h5>Nội dung bài viết</h5>

                <span>Thông tin chính hiển thị trên website</span>
              </div>
            </div>

            <div className="post-edit-card-body">
              {/* TITLE */}

              <div className="post-edit-form-group">
                <Form.Label className="post-edit-label">
                  Tiêu đề bài viết
                  <span className="text-danger">*</span>
                </Form.Label>

                <Form.Control
                  className="post-edit-input post-edit-title-input"
                  type="text"
                  name="title"
                  placeholder="Nhập tiêu đề bài viết..."
                  value={blogData.title}
                  onChange={handleChange}
                />

                <div className="post-edit-field-help">
                  Sửa tiêu đề không tự thay đổi slug để tránh ảnh hưởng đường
                  dẫn SEO hiện tại.
                </div>
              </div>

              {/* SLUG */}

              <div className="post-edit-form-group">
                <Form.Label className="post-edit-label">
                  Đường dẫn bài viết
                  <span className="text-danger">*</span>
                </Form.Label>

                <div className="post-edit-slug-wrapper">
                  <span>/blog/</span>

                  <Form.Control
                    className="post-edit-input post-edit-slug-input"
                    type="text"
                    name="slug"
                    value={blogData.slug}
                    onChange={handleChange}
                  />
                </div>

                <div className="post-edit-field-help">
                  Chỉ nên sửa slug khi thật sự cần thiết vì có thể ảnh hưởng URL
                  cũ.
                </div>
              </div>

              {/* DESCRIPTION */}

              <div className="post-edit-form-group">
                <div className="post-edit-label-row">
                  <Form.Label className="post-edit-label">
                    Mô tả ngắn
                    <span className="text-danger">*</span>
                  </Form.Label>

                  <span
                    className={
                      blogData.description.length > 160
                        ? "post-edit-char-count danger"
                        : "post-edit-char-count"
                    }
                  >
                    {blogData.description.length}
                    /160
                  </span>
                </div>

                <Form.Control
                  className="post-edit-input"
                  as="textarea"
                  name="description"
                  value={blogData.description}
                  onChange={handleChange}
                  rows={3}
                  maxLength={250}
                  placeholder="Nhập mô tả ngắn..."
                />

                <div className="post-edit-field-help">
                  Khuyến nghị khoảng 120–160 ký tự để hiển thị tốt trên Google.
                </div>
              </div>
            </div>
          </div>

          {/* ===============================================
              EDITOR
          =============================================== */}

          <div className="post-edit-card post-edit-editor-card">
            <div className="post-edit-card-header">
              <div>
                <h5>Nội dung chi tiết</h5>

                <span>Nội dung chính của bài viết</span>
              </div>

              <div className="post-edit-autosave-status">
                <span className="post-edit-status-dot"></span>
                Tự động ghi nhận
              </div>
            </div>

            <div className="post-edit-word-wrapper">
              <Word value={blogData.content} onChange={handleContentChange} />
            </div>
          </div>
        </Col>

        {/* =================================================
            RIGHT
        ================================================= */}

        <Col xl={4} lg={4}>
          <div className="post-edit-sidebar">
            {/* =============================================
                UPDATE
            ============================================= */}

            <div className="post-edit-card post-edit-publish-card">
              <div className="post-edit-card-header">
                <div>
                  <h5>Cập nhật bài viết</h5>

                  <span>Kiểm tra thông tin trước khi lưu</span>
                </div>
              </div>

              <div className="post-edit-card-body">
                {/* PROGRESS */}

                <div className="post-edit-progress-header">
                  <span>Mức độ hoàn thiện</span>

                  <strong>{completionData.percent}%</strong>
                </div>

                <div className="post-edit-progress">
                  <div
                    style={{
                      width: `${completionData.percent}%`,
                    }}
                  ></div>
                </div>

                {/* CHECK LIST */}

                <div className="post-edit-check-list">
                  {completionData.checks.map((item, index) => (
                    <div
                      key={index}
                      className={`post-edit-check-item ${
                        item.done ? "completed" : ""
                      }`}
                    >
                      <span className="post-edit-check-icon">
                        {item.done ? <FiCheck /> : index + 1}
                      </span>

                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* UPDATE BUTTON */}

                <Button
                  className="post-edit-btn-submit"
                  onClick={handleUpdatePost}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" animation="border" />
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <FiSave />
                      CẬP NHẬT BÀI VIẾT
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  className="post-edit-cancel-btn"
                  onClick={() => navigate("/guide-travel-list")}
                >
                  Hủy và quay lại
                </button>
              </div>
            </div>

            {/* =============================================
                CATEGORY
            ============================================= */}

            <div className="post-edit-card">
              <div className="post-edit-card-header">
                <div>
                  <h5>Danh mục</h5>

                  <span>Phân loại bài viết</span>
                </div>
              </div>

              <div className="post-edit-card-body">
                <Form.Select
                  className="post-edit-input"
                  name="category_id"
                  value={blogData.category_id}
                  onChange={handleChange}
                >
                  <option value="">-- Chọn danh mục --</option>

                  {dataCategories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.category_name}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </div>

            {/* =============================================
                IMAGE
            ============================================= */}

            <div className="post-edit-card">
              <div className="post-edit-card-header">
                <div>
                  <h5>Ảnh đại diện</h5>

                  <span>Hình ảnh hiển thị ngoài danh sách</span>
                </div>
              </div>

              <div className="post-edit-card-body">
                <div
                  className={`post-edit-image-preview ${
                    blogData.thumbnail_url ? "has-image" : ""
                  }`}
                >
                  {blogData.thumbnail_url ? (
                    <>
                      <img
                        src={blogData.thumbnail_url}
                        alt="Ảnh đại diện bài viết"
                      />

                      <button
                        type="button"
                        className="post-edit-remove-image"
                        onClick={handleRemoveThumbnail}
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <div className="post-edit-image-empty">
                      <div className="post-edit-image-icon">
                        <FiImage />
                      </div>

                      <strong>Chưa có ảnh đại diện</strong>

                      <span>Khuyến nghị ảnh tỷ lệ 16:9</span>
                    </div>
                  )}
                </div>

                <div className="post-edit-upload-action">
                  <ImageCDNCloud onUploadSuccess={handleUploadSuccess} />
                </div>

                {blogData.thumbnail_url && (
                  <div className="post-edit-image-help">
                    Upload ảnh mới sẽ thay thế ảnh đại diện hiện tại.
                  </div>
                )}
              </div>
            </div>

            {/* =============================================
                TAGS
            ============================================= */}

            <div className="post-edit-card">
              <div className="post-edit-card-header">
                <div>
                  <h5>Tags</h5>

                  <span>Đã chọn {selectedTags.length} tag</span>
                </div>
              </div>

              <div className="post-edit-card-body">
                {dataTag.length > 0 ? (
                  <div className="post-edit-tag-cloud">
                    {dataTag.map((tag) => {
                      const tagId = Number(tag.tag_id);

                      const active = selectedTags.includes(tagId);

                      return (
                        <button
                          key={tag.tag_id}
                          type="button"
                          className={`post-edit-tag-btn ${
                            active ? "active" : ""
                          }`}
                          onClick={() => handleTagChange(tagId)}
                        >
                          {active && <span>✓ </span>}

                          {tag.tag_name}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="post-edit-empty-tags">Chưa có tags.</div>
                )}
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* =================================================
          TOAST
      ================================================= */}

      <ToastContainer
        position="top-end"
        className="p-3"
        style={{
          position: "fixed",
          zIndex: 10000,
        }}
      >
        <Toast
          bg={alertVariant}
          show={successAlertOpen}
          onClose={() => setSuccessAlertOpen(false)}
          delay={4000}
          autohide
        >
          <Toast.Header
            closeButton
            className="text-white"
            style={{
              backgroundColor: "rgba(0,0,0,0.12)",
              borderBottom: "none",
            }}
          >
            <strong className="me-auto">Thông báo</strong>
          </Toast.Header>

          <Toast.Body className="text-white fw-bold">{alertMessage}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* =================================================
          LOADING UPDATE
      ================================================= */}

      {loading && (
        <div className="post-edit-loading-overlay">
          <div className="post-edit-loading-box">
            <Spinner animation="border" />

            <span>Đang cập nhật bài viết...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostEdit;
