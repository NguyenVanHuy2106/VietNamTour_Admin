import React, { useEffect, useState } from "react";
import Word from "../../components/Word";
import {
  Container,
  Row,
  Col,
  Button,
  Tabs,
  Tab,
  Toast,
  Spinner,
} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";
import ImageCDNCloud from "../../components/ImageCDNCloud";
const GuideTravel = () => {
  let userId = localStorage.getItem("userId");
  const [key, setKey] = useState("info");
  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [dataTag, setDataTag] = useState([]);
  const [dataCategories, setDataCategories] = useState([]);
  let [loading, setLoading] = useState(false);
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

  const dataDefaultBlogData = {
    title: "",
    slug: "",
    content: "",
    thumbnail_url: "",
    description: "",
    category_id: "",
    created_by: userId,
    tag_ids: [],
  };

  const [selectedTags, setSelectedTags] = useState([]);

  // Hàm handleChange đã được sửa lại cho đúng logic
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Chuyển đổi giá trị sang số nguyên nếu là category_id,
    // ngược lại giữ nguyên giá trị chuỗi
    const newValue = name === "category_id" ? parseInt(value, 10) : value;
    setBlogData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleContentChange = (newContent) => {
    setBlogData((prevData) => ({
      ...prevData,
      content: newContent,
    }));
    setAlertMessage("Lưu thông tin thành công");
    setSuccessAlertOpen(true);
  };

  const handleTagChange = (tagId) => {
    setSelectedTags((prevSelected) => {
      let newSelectedTags;
      if (prevSelected.includes(tagId)) {
        newSelectedTags = prevSelected.filter((id) => id !== tagId);
      } else {
        newSelectedTags = [...prevSelected, tagId];
      }
      setBlogData((prevData) => ({ ...prevData, tag_ids: newSelectedTags }));
      return newSelectedTags;
    });
  };
  const handleUploadSuccess = (url) => {
    setBlogData((prevData) => ({
      ...prevData,
      // Gán trực tiếp URL của hình ảnh mới vào trường thumbnail_url
      thumbnail_url: url,
    }));
  };

  const handleSubmit = async (e) => {
    //console.log(blogData);
    try {
      setLoading(true);
      const response = await APIToken.post("/post/add", blogData);

      if (response.status === 201) {
        setAlertMessage("Bài viết đã được thêm thành công!");
        setSuccessAlertOpen(true);
        setBlogData(dataDefaultBlogData);
      }
    } catch (error) {
      console.log(error.response.data.message);
      return error;
    } finally {
      setLoading(false);
    }
  };

  const getData = async () => {
    try {
      setLoading(true);
      const response = await API.get("/tag/get");
      setDataTag(response.data.data || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách Tag", error.response || error);
    } finally {
      setLoading(false);
    }
  };

  const getCategories = async () => {
    try {
      setLoading(true);
      const response = await API.get("/categories/get");
      setDataCategories(response.data.data || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách danh mục", error.response || error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
    getCategories();
  }, []);

  return (
    <Container className="mt-2">
      <div
        style={{
          borderBottom: "1px solid #1D61AD",
          fontSize: 20,
          paddingTop: 10,
          paddingBottom: 10,
          marginBottom: 20,
          color: "#1d61ad",
        }}
      >
        THÊM MỚI BÀI VIẾT
      </div>
      <Tabs
        id="tour-add-tabs"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-3"
      >
        <Tab eventKey="info" title="Thông tin chung">
          <Row className="mb-3">
            <Col>
              <Form.Label>Tiêu đề bài viết</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={blogData.title}
                onChange={handleChange}
              />
            </Col>
          </Row>
          <Row className="mb-3">
            <Col>
              <Form.Label>Đường dẫn thân thiện</Form.Label>
              <Form.Control
                type="text"
                name="slug"
                value={blogData.slug}
                onChange={handleChange}
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <label>Danh mục bài viết:</label>
              <select
                name="category_id"
                className="form-control"
                value={blogData.category_id}
                onChange={handleChange}
              >
                <option value="">-- Chọn --</option>
                {dataCategories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_id + " - " + cat.category_name}
                  </option>
                ))}
              </select>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Label>Mô tả ngắn</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={blogData.description}
                onChange={handleChange}
                rows={5}
                style={{ resize: "both", minHeight: "150px" }}
              />
            </Col>
          </Row>
          <Row className="mt-3">
            <Col>
              <Form.Label>Thẻ (Tags)</Form.Label>
              <div>
                {dataTag.map((tag) => (
                  <Button
                    key={tag.tag_id}
                    variant={
                      selectedTags.includes(tag.tag_id)
                        ? "primary"
                        : "outline-primary"
                    }
                    onClick={() => handleTagChange(tag.tag_id)}
                    className="me-2 mb-2"
                  >
                    {tag.tag_name}
                  </Button>
                ))}
              </div>
            </Col>
          </Row>
        </Tab>
        <Tab eventKey="detail" title="Nội dung bài viết">
          <Row className="mb-3">
            <Word onSave={handleContentChange} />
          </Row>
        </Tab>
        <Tab eventKey="image" title="Ảnh đại diện">
          <Row className="mb-3">
            <Col>
              <div style={{ marginLeft: 37, marginTop: 12 }}>
                <div className="d-flex mt-3">
                  <div
                    style={{
                      marginRight: 10,
                    }}
                  >
                    Chọn ảnh đại diện:{" "}
                  </div>
                  <ImageCDNCloud onUploadSuccess={handleUploadSuccess} />
                </div>
                {blogData.thumbnail_url ? (
                  <img
                    src={blogData.thumbnail_url}
                    alt="Selected file"
                    width={220}
                    height={220}
                    style={{ marginTop: 20 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 220,
                      height: 220,
                      border: "1px #000000 dashed",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      marginTop: 20,
                    }}
                  >
                    <p>Avatar</p>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Tab>
      </Tabs>
      <Button onClick={handleSubmit} className="mt-3" style={{ width: "100%" }}>
        Thêm Bài Viết
      </Button>
      <Toast
        onClose={() => setSuccessAlertOpen(false)}
        show={successAlertOpen}
        delay={3000}
        autohide
        className="position-fixed top-0 end-0 m-3"
      >
        <Toast.Body>{alertMessage}</Toast.Body>
      </Toast>
    </Container>
  );
};

export default GuideTravel;
