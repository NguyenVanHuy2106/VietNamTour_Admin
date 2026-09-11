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

import Word from "../../components/Word";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";
import ImageCDNCloud from "../../components/ImageCDNCloud";
import slugify from "slugify";

import "./index.css";

const GuideTravel = () => {
  const userId = localStorage.getItem("userId");

  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("primary");

  const [dataTag, setDataTag] = useState([]);
  const [dataCategories, setDataCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [blogData, setBlogData] = useState({
    title: "",
    slug: "",
    content: "",
    thumbnail_url: "",
    description: "",
    category_id: "",
    created_by: userId,
    tag_ids: [],
  });

  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    getData();
    getCategories();
  }, []);

  const getData = async () => {
    try {
      const response = await API.get("/tag/get");
      setDataTag(response.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const getCategories = async () => {
    try {
      const response = await API.get("/categories/get");
      setDataCategories(response.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const createSlug = (text) => {
    return slugify(text || "", {
      lower: true,
      locale: "vi",
      remove: /[*+~.()'"!:@]/g,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    let newValue = value;

    if (name === "category_id") {
      newValue = value === "" ? "" : parseInt(value, 10);
    }

    setBlogData((prev) => ({
      ...prev,
      [name]: newValue,

      ...(name === "title"
        ? {
            slug: createSlug(value),
          }
        : {}),
    }));
  };

  /**
   * QUAN TRỌNG:
   * Hàm này giờ dùng để đồng bộ content trực tiếp khi soạn.
   * Không còn phụ thuộc người dùng bấm nút Lưu.
   */
  const handleContentChange = (newContent) => {
    setBlogData((prev) => ({
      ...prev,
      content: newContent || "",
    }));
  };

  const handleTagChange = (tagId) => {
    setSelectedTags((prevSelected) => {
      const newSelectedTags = prevSelected.includes(tagId)
        ? prevSelected.filter((id) => id !== tagId)
        : [...prevSelected, tagId];

      setBlogData((prevData) => ({
        ...prevData,
        tag_ids: newSelectedTags,
      }));

      return newSelectedTags;
    });
  };

  const handleUploadSuccess = (url) => {
    setBlogData((prevData) => ({
      ...prevData,
      thumbnail_url: url,
    }));
  };

  const showToast = (variant, message) => {
    setAlertVariant(variant);
    setAlertMessage(message);
    setSuccessAlertOpen(true);
  };

  const handleSubmit = async () => {
    if (!blogData.title.trim()) {
      showToast("danger", "Vui lòng nhập tiêu đề bài viết.");
      return;
    }

    if (!blogData.category_id) {
      showToast("danger", "Vui lòng chọn danh mục bài viết.");
      return;
    }

    if (!blogData.content || blogData.content.trim() === "") {
      showToast("danger", "Vui lòng nhập nội dung bài viết.");
      return;
    }

    try {
      setLoading(true);

      const response = await APIToken.post("/post/add", blogData);

      if (response.status === 201) {
        showToast("success", "Đăng bài viết thành công! 🎉");

        setBlogData({
          title: "",
          slug: "",
          content: "",
          thumbnail_url: "",
          description: "",
          category_id: "",
          created_by: userId,
          tag_ids: [],
        });

        setSelectedTags([]);
      }
    } catch (error) {
      console.error(error);

      showToast(
        "danger",
        error?.response?.data?.message ||
          "Không thể thêm bài viết. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Đếm mức độ hoàn thiện bài
  const completion = useMemo(() => {
    const items = [
      Boolean(blogData.title.trim()),
      Boolean(blogData.category_id),
      Boolean(blogData.content?.trim()),
      Boolean(blogData.thumbnail_url),
    ];

    const completed = items.filter(Boolean).length;

    return Math.round((completed / items.length) * 100);
  }, [blogData]);

  return (
    <div className="adv-container">
      {/* HEADER */}
      <div className="adv-page-header">
        <div>
          <div className="adv-page-title-row">
            <h2>Thêm bài viết mới</h2>

            <Badge
              bg={completion === 100 ? "success" : "primary"}
              className="adv-completion-badge"
            >
              Hoàn thiện {completion}%
            </Badge>
          </div>

          <p>
            Nhập nội dung bài viết, thiết lập danh mục, hình ảnh và đăng bài.
            Nội dung được ghi nhận trực tiếp khi soạn thảo.
          </p>
        </div>
      </div>

      <Row className="g-4">
        {/* ===================================================== */}
        {/* CỘT TRÁI */}
        {/* ===================================================== */}

        <Col xl={8} lg={8}>
          {/* TIÊU ĐỀ */}
          <div className="adv-card">
            <div className="adv-card-header">
              <div>
                <h5>Nội dung bài viết</h5>
                <span>Thông tin chính hiển thị trên website</span>
              </div>
            </div>

            <div className="adv-card-body">
              <div className="adv-form-group">
                <Form.Label className="adv-label">
                  Tiêu đề bài viết
                  <span className="text-danger">*</span>
                </Form.Label>

                <Form.Control
                  className="adv-input adv-title-input"
                  type="text"
                  name="title"
                  placeholder="Ví dụ: Top 10 địa điểm du lịch Mũi Né không nên bỏ lỡ"
                  value={blogData.title}
                  onChange={handleChange}
                />

                <div className="adv-field-help">
                  Nên sử dụng tiêu đề rõ ràng, hấp dẫn và chứa từ khóa chính.
                </div>
              </div>

              {/* SLUG */}
              <div className="adv-form-group">
                <Form.Label className="adv-label">
                  Đường dẫn bài viết
                </Form.Label>

                <div className="adv-slug-wrapper">
                  <span>/blog/</span>

                  <Form.Control
                    className="adv-input adv-slug-input"
                    type="text"
                    name="slug"
                    placeholder="du-lich-mui-ne"
                    value={blogData.slug}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="adv-form-group">
                <div className="adv-label-row">
                  <Form.Label className="adv-label">Mô tả ngắn</Form.Label>

                  <span
                    className={
                      blogData.description.length > 160
                        ? "adv-char-count danger"
                        : "adv-char-count"
                    }
                  >
                    {blogData.description.length}/160
                  </span>
                </div>

                <Form.Control
                  className="adv-input"
                  as="textarea"
                  name="description"
                  value={blogData.description}
                  onChange={handleChange}
                  rows={3}
                  maxLength={250}
                  placeholder="Nhập đoạn mô tả ngắn dùng khi hiển thị danh sách bài viết và SEO..."
                />

                <div className="adv-field-help">
                  Khuyến nghị khoảng 120–160 ký tự.
                </div>
              </div>
            </div>
          </div>

          {/* EDITOR */}
          <div className="adv-card adv-editor-card">
            <div className="adv-card-header">
              <div>
                <h5>Nội dung chi tiết</h5>
                <span>Soạn nội dung chính của bài viết</span>
              </div>

              <div className="adv-autosave-status">
                <span className="adv-status-dot"></span>
                Tự động ghi nhận nội dung
              </div>
            </div>

            <div className="adv-card-body adv-word-wrapper">
              {/*
                Word cần gọi onChange mỗi khi nội dung thay đổi.

                Giữ onSave để tương thích với Word cũ trong lúc ông
                chưa xoá nút Save khỏi component đó.
              */}

              <Word
                onChange={handleContentChange}
                onSave={handleContentChange}
              />
            </div>
          </div>
        </Col>

        {/* ===================================================== */}
        {/* CỘT PHẢI */}
        {/* ===================================================== */}

        <Col xl={4} lg={4}>
          <div className="adv-sidebar">
            {/* ĐĂNG BÀI */}
            <div className="adv-card adv-publish-card">
              <div className="adv-card-header">
                <div>
                  <h5>Đăng bài</h5>
                  <span>Kiểm tra trước khi xuất bản</span>
                </div>
              </div>

              <div className="adv-card-body">
                <div className="adv-check-list">
                  <div
                    className={`adv-check-item ${
                      blogData.title ? "completed" : ""
                    }`}
                  >
                    <span className="adv-check-icon">
                      {blogData.title ? "✓" : "1"}
                    </span>

                    <span>Tiêu đề bài viết</span>
                  </div>

                  <div
                    className={`adv-check-item ${
                      blogData.category_id ? "completed" : ""
                    }`}
                  >
                    <span className="adv-check-icon">
                      {blogData.category_id ? "✓" : "2"}
                    </span>

                    <span>Danh mục</span>
                  </div>

                  <div
                    className={`adv-check-item ${
                      blogData.content ? "completed" : ""
                    }`}
                  >
                    <span className="adv-check-icon">
                      {blogData.content ? "✓" : "3"}
                    </span>

                    <span>Nội dung chi tiết</span>
                  </div>

                  <div
                    className={`adv-check-item ${
                      blogData.thumbnail_url ? "completed" : ""
                    }`}
                  >
                    <span className="adv-check-icon">
                      {blogData.thumbnail_url ? "✓" : "4"}
                    </span>

                    <span>Ảnh đại diện</span>
                  </div>
                </div>

                <Button
                  className="adv-btn-submit"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-2" />
                      Đang đăng...
                    </>
                  ) : (
                    "ĐĂNG BÀI VIẾT"
                  )}
                </Button>
              </div>
            </div>

            {/* DANH MỤC */}
            <div className="adv-card">
              <div className="adv-card-header">
                <div>
                  <h5>Danh mục</h5>
                  <span>Phân loại bài viết</span>
                </div>
              </div>

              <div className="adv-card-body">
                <Form.Select
                  className="adv-input"
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

            {/* ẢNH */}
            <div className="adv-card">
              <div className="adv-card-header">
                <div>
                  <h5>Ảnh đại diện</h5>
                  <span>Hình ảnh hiển thị ngoài danh sách</span>
                </div>
              </div>

              <div className="adv-card-body">
                <div
                  className={`adv-image-preview ${
                    blogData.thumbnail_url ? "has-image" : ""
                  }`}
                >
                  {blogData.thumbnail_url ? (
                    <img
                      src={blogData.thumbnail_url}
                      alt="Ảnh đại diện bài viết"
                    />
                  ) : (
                    <div className="adv-image-empty">
                      <div className="adv-image-icon">▧</div>

                      <strong>Chưa có ảnh đại diện</strong>

                      <span>Khuyến nghị ảnh tỷ lệ 16:9</span>
                    </div>
                  )}
                </div>

                <div className="adv-upload-action">
                  <ImageCDNCloud onUploadSuccess={handleUploadSuccess} />
                </div>
              </div>
            </div>

            {/* TAG */}
            <div className="adv-card">
              <div className="adv-card-header">
                <div>
                  <h5>Tags</h5>

                  <span>Đã chọn {selectedTags.length} tag</span>
                </div>
              </div>

              <div className="adv-card-body">
                {dataTag.length > 0 ? (
                  <div className="adv-tag-cloud">
                    {dataTag.map((tag) => (
                      <button
                        key={tag.tag_id}
                        type="button"
                        className={`adv-tag-btn ${
                          selectedTags.includes(tag.tag_id) ? "active" : ""
                        }`}
                        onClick={() => handleTagChange(tag.tag_id)}
                      >
                        {selectedTags.includes(tag.tag_id) && <span>✓ </span>}

                        {tag.tag_name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="adv-empty-tags">Chưa có tags.</div>
                )}
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* TOAST */}
      <ToastContainer
        position="top-end"
        className="p-3"
        style={{
          position: "fixed",
          zIndex: 9999,
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
    </div>
  );
};

export default GuideTravel;
