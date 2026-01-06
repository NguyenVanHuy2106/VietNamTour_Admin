import React, { useEffect, useState } from "react";
import Word from "../../components/Word";
import {
  Row,
  Col,
  Button,
  Tabs,
  Tab,
  Toast,
  ToastContainer,
  Spinner,
} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";
import ImageCDNCloud from "../../components/ImageCDNCloud";
import slugify from "slugify";
import "./index.css";

const GuideTravel = () => {
  let userId = localStorage.getItem("userId");
  const [key, setKey] = useState("info");
  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("primary"); // Thêm màu cho Toast
  const [dataTag, setDataTag] = useState([]);
  const [dataCategories, setDataCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState("");

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

  const handleChange = (e) => {
    const { name, value } = e.target;

    // 1. Ép kiểu cho category_id
    let newValue = name === "category_id" ? parseInt(value, 10) : value;

    setBlogData((prev) => ({
      ...prev,
      // 2. Cập nhật field đang nhập
      [name]: newValue,

      // 3. Nếu đang nhập title, cập nhật luôn slug (với điều kiện dùng thư viện slugify)
      ...(name === "title" ? { slug: createSlug(value) } : {}),
    }));
  };

  // Hàm này chạy khi người dùng bấm nút Lưu trong component Word
  const handleContentChange = (newContent) => {
    setBlogData((prev) => ({ ...prev, content: newContent }));
    setAlertVariant("success");
    setAlertMessage("Nội dung bài viết đã được ghi nhận! ✨");
    setSuccessAlertOpen(true);
  };

  const handleTagChange = (tagId) => {
    setSelectedTags((prevSelected) => {
      const newSelectedTags = prevSelected.includes(tagId)
        ? prevSelected.filter((id) => id !== tagId)
        : [...prevSelected, tagId];
      setBlogData((prevData) => ({ ...prevData, tag_ids: newSelectedTags }));
      return newSelectedTags;
    });
  };

  const handleUploadSuccess = (url) => {
    setBlogData((prevData) => ({ ...prevData, thumbnail_url: url }));
  };

  const handleSubmit = async (e) => {
    // --- KIỂM TRA RÀNG BUỘC (VALIDATION) ---
    if (!blogData.title || !blogData.category_id) {
      setAlertVariant("danger");
      setAlertMessage("Vui lòng nhập đầy đủ Tiêu đề và Danh mục!");
      setSuccessAlertOpen(true);
      setKey("info"); // Chuyển về tab thông tin
      return;
    }

    if (!blogData.content || blogData.content.trim() === "") {
      setAlertVariant("danger");
      setAlertMessage(
        "Bạn CHƯA LƯU nội dung chi tiết. Hãy bấm nút Lưu trong soạn thảo!"
      );
      setSuccessAlertOpen(true);
      setKey("detail"); // Tự động chuyển sang tab nội dung để nhắc người dùng
      return;
    }

    try {
      setLoading(true);
      const response = await APIToken.post("/post/add", blogData);
      if (response.status === 201) {
        setAlertVariant("success");
        setAlertMessage("Chúc mừng! Bài viết đã được đăng thành công! 🎉");
        setSuccessAlertOpen(true);
        // Reset Form
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
      setAlertVariant("danger");
      setAlertMessage("Lỗi hệ thống: Không thể thêm bài viết.");
      setSuccessAlertOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const createSlug = (text) => {
    return slugify(text, {
      lower: true, // Chuyển về chữ thường
      locale: "vi", // Xử lý tiếng Việt (đ, ê, ô...)
      remove: /[*+~.()'"!:@]/g, // Loại bỏ ký tự đặc biệt
    });
  };

  return (
    <div className="adv-container">
      <div className="adv-header">
        <div className="adv-header-info">
          <h2>THÊM MỚI BÀI VIẾT</h2>
          <p>
            Lưu ý: Bạn cần bấm "Lưu" ở tab Nội dung chi tiết trước khi hoàn tất.
          </p>
        </div>
      </div>

      <div className="adv-content-card">
        <Tabs
          id="guide-tabs"
          activeKey={key}
          onSelect={(k) => setKey(k)}
          className="adv-tabs mb-4"
        >
          <Tab eventKey="info" title="1. Thông tin chung">
            <div className="adv-form-section">
              <Row className="mb-4">
                <Col md={12}>
                  <Form.Label className="adv-label">
                    Tiêu đề bài viết <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    className="adv-input"
                    type="text"
                    name="title"
                    placeholder="Nhập tiêu đề bài viết..."
                    value={blogData.title}
                    onChange={handleChange}
                  />
                </Col>
              </Row>

              <Row className="mb-4">
                <Col md={6}>
                  <Form.Label className="adv-label">
                    Đường dẫn (Slug)
                  </Form.Label>
                  <Form.Control
                    className="adv-input"
                    type="text"
                    name="slug"
                    placeholder="ví dụ: kinh-nghiem-du-lich"
                    value={blogData.slug}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={6}>
                  <Form.Label className="adv-label">
                    Danh mục <span className="text-danger">*</span>
                  </Form.Label>
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
                </Col>
              </Row>

              <Row className="mb-4">
                <Col>
                  <Form.Label className="adv-label">Mô tả ngắn</Form.Label>
                  <Form.Control
                    className="adv-input"
                    as="textarea"
                    name="description"
                    value={blogData.description}
                    onChange={handleChange}
                    rows={4}
                  />
                </Col>
              </Row>

              <Row className="mb-3">
                <Col>
                  <Form.Label className="adv-label">Tags</Form.Label>
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
                        {tag.tag_name}
                      </button>
                    ))}
                  </div>
                </Col>
              </Row>
            </div>
          </Tab>

          <Tab eventKey="detail" title="2. Nội dung chi tiết">
            <div className="adv-editor-section">
              <div className="adv-warning-box mb-3">
                ⚠️ <strong>Lưu ý:</strong> Soạn thảo xong bạn phải bấm nút{" "}
                <strong>"Lưu"</strong> (biểu tượng đĩa mềm) trong trình soạn
                thảo bên dưới.
              </div>
              <Word onSave={handleContentChange} />
            </div>
          </Tab>

          <Tab eventKey="image" title="3. Ảnh đại diện">
            <div className="adv-image-section">
              <div className="adv-upload-zone">
                <div className="d-flex align-items-center gap-3 mb-4">
                  <span className="fw-bold">Ảnh bìa:</span>
                  <ImageCDNCloud onUploadSuccess={handleUploadSuccess} />
                </div>
                <div className="adv-preview-box">
                  {blogData.thumbnail_url ? (
                    <img src={blogData.thumbnail_url} alt="Thumbnail" />
                  ) : (
                    <div className="adv-preview-placeholder">Chưa có ảnh</div>
                  )}
                </div>
              </div>
            </div>
          </Tab>
        </Tabs>

        <div className="adv-footer-actions">
          <Button
            className="adv-btn-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <Spinner size="sm" animation="border" className="me-2" />
            ) : (
              "XÁC NHẬN ĐĂNG BÀI VIẾT"
            )}
          </Button>
        </div>
      </div>

      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ position: "fixed", zIndex: 9999 }} // Đã sửa z-index thành zIndex
      >
        <Toast
          bg={alertVariant}
          show={successAlertOpen}
          onClose={() => setSuccessAlertOpen(false)}
          delay={4000}
          autohide
        >
          <Toast.Header
            closeButton={false}
            className="text-white"
            style={{ backgroundColor: "rgba(0,0,0,0.1)", borderBottom: "none" }}
          >
            <strong className="me-auto">Thông báo hệ thống</strong>
          </Toast.Header>
          <Toast.Body className="text-white fw-bold">{alertMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default GuideTravel;
