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
  FiTrash2,
  FiPlus,
  FiCheck,
  FiImage,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiUsers,
} from "react-icons/fi";
import slugify from "slugify";

import Word from "../../components/Word";
import ImageCDNCloud from "../../components/ImageCDNCloud";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";

import "./index.css";

const TourAdd = () => {
  const userId = localStorage.getItem("userId");

  const createDefaultTourData = () => ({
    tourname: "",
    slug: "",
    description: "",
    destination: "",
    departure: "",
    timetypeid: "",
    hoteltypeid: "",
    startdate: "",
    enddate: "",
    vehicletypeid: "",
    created_by: userId,
    images: [],
    detailContent: "",
    price: {
      adultprice: "",
      childprice: "",
      freeprice: "",
      promotion: 0,
    },
    highlights: [{ highlight_key: 1, highlight_value: "" }],
    isGroup: false,
  });

  const [tourData, setTourData] = useState(createDefaultTourData);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("success");

  const [options, setOptions] = useState({
    destinations: [],
    departures: [],
    timeTypes: [],
    hotelTypes: [],
    vehicleTypes: [],
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      setLoadingOptions(true);

      const [dep, time, hotel, vehicle, des] = await Promise.all([
        API.get("/province/get"),
        API.get("/timeType/get"),
        API.get("/hotelType/get"),
        API.get("/vehicleType/get"),
        API.get("/travelLocation/get"),
      ]);

      setOptions({
        destinations: des.data.data || [],
        departures: dep.data.data || [],
        timeTypes: time.data.data || [],
        hotelTypes: hotel.data.data || [],
        vehicleTypes: vehicle.data.data || [],
      });
    } catch (error) {
      console.error("Failed to fetch dropdown data", error);
      showToast("danger", "Không thể tải dữ liệu danh mục tour.");
    } finally {
      setLoadingOptions(false);
    }
  };

  const showToast = (variant, message) => {
    setAlertVariant(variant);
    setAlertMessage(message);
    setSuccessAlertOpen(true);
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

    setTourData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "tourname" ? { slug: createSlug(value) } : {}),
    }));
  };

  const handleGroupChange = (e) => {
    const checked = e.target.checked;

    setTourData((prev) => ({
      ...prev,
      isGroup: checked,
    }));
  };

  const handlePriceChange = (field, value) => {
    setTourData((prev) => ({
      ...prev,
      price: {
        ...prev.price,
        [field]: value === "" ? "" : Number(value),
      },
    }));
  };

  const handleContentChange = (newContent) => {
    setTourData((prev) => ({
      ...prev,
      detailContent: newContent,
    }));
  };

  const handleHighlightChange = (index, value) => {
    setTourData((prev) => ({
      ...prev,
      highlights: prev.highlights.map((item, idx) =>
        idx === index ? { ...item, highlight_value: value } : item,
      ),
    }));
  };

  const handleAddHighlight = () => {
    setTourData((prev) => ({
      ...prev,
      highlights: [
        ...prev.highlights,
        {
          highlight_key: prev.highlights.length + 1,
          highlight_value: "",
        },
      ],
    }));
  };

  const handleRemoveHighlight = (index) => {
    setTourData((prev) => {
      const nextHighlights = prev.highlights
        .filter((_, idx) => idx !== index)
        .map((item, idx) => ({
          ...item,
          highlight_key: idx + 1,
        }));

      return {
        ...prev,
        highlights:
          nextHighlights.length > 0
            ? nextHighlights
            : [{ highlight_key: 1, highlight_value: "" }],
      };
    });
  };

  const handleUploadSuccess = (url) => {
    setTourData((prev) => ({
      ...prev,
      images: [
        ...prev.images.filter((img) => img.imagetype !== 0),
        {
          imagename: "",
          imageurl: url,
          imagetype: 0,
        },
      ],
    }));
  };

  const handleUploadImageListSuccess = (newImageUrl) => {
    const newImage = {
      imagename: "New Image",
      imageurl: newImageUrl,
      imagetype: 1,
    };

    setTourData((prev) => ({
      ...prev,
      images: [...prev.images, newImage],
    }));
  };

  const removeAvatar = () => {
    setTourData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.imagetype !== 0),
    }));
  };

  const removeGalleryImage = (galleryIndex) => {
    setTourData((prev) => {
      let currentGalleryIndex = -1;

      return {
        ...prev,
        images: prev.images.filter((img) => {
          if (img.imagetype !== 1) return true;

          currentGalleryIndex += 1;
          return currentGalleryIndex !== galleryIndex;
        }),
      };
    });
  };

  const avatar = useMemo(
    () => tourData.images.find((img) => img.imagetype === 0 && img.imageurl),
    [tourData.images],
  );

  const galleryImages = useMemo(
    () => tourData.images.filter((img) => img.imagetype === 1 && img.imageurl),
    [tourData.images],
  );

  const isHtmlEmpty = (html) => {
    if (!html) return true;

    const text = html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, "")
      .trim();

    return text === "";
  };

  const requiredChecks = useMemo(
    () => [
      {
        key: "tourname",
        label: "Tên tour",
        done: Boolean(tourData.tourname.trim()),
      },
      {
        key: "destination",
        label: "Điểm đến",
        done: Boolean(tourData.destination),
      },
      {
        key: "departure",
        label: "Điểm khởi hành",
        done: Boolean(tourData.departure),
      },
      {
        key: "time",
        label: "Loại thời gian",
        done: Boolean(tourData.timetypeid),
      },
      {
        key: "content",
        label: "Nội dung chi tiết",
        done: !isHtmlEmpty(tourData.detailContent),
      },
      {
        key: "avatar",
        label: "Ảnh đại diện",
        done: Boolean(avatar),
      },
    ],
    [tourData, avatar],
  );

  const completion = useMemo(() => {
    const completed = requiredChecks.filter((item) => item.done).length;
    return Math.round((completed / requiredChecks.length) * 100);
  }, [requiredChecks]);

  const formatCurrency = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    return Number(value).toLocaleString("vi-VN");
  };

  const validateTour = () => {
    if (!tourData.tourname.trim()) {
      showToast("danger", "Vui lòng nhập tên tour.");
      return false;
    }

    if (!tourData.destination) {
      showToast("danger", "Vui lòng chọn điểm đến.");
      return false;
    }

    if (!tourData.departure) {
      showToast("danger", "Vui lòng chọn điểm khởi hành.");
      return false;
    }

    if (!tourData.timetypeid) {
      showToast("danger", "Vui lòng chọn loại thời gian.");
      return false;
    }

    if (
      tourData.startdate &&
      tourData.enddate &&
      new Date(tourData.enddate) < new Date(tourData.startdate)
    ) {
      showToast("danger", "Ngày về không được nhỏ hơn ngày khởi hành.");
      return false;
    }

    if (isHtmlEmpty(tourData.detailContent)) {
      showToast("danger", "Vui lòng nhập nội dung chi tiết cho tour.");
      return false;
    }

    return true;
  };

  const handleAddTour = async () => {
    if (!validateTour()) return;

    try {
      setLoading(true);
      //console.log("TOUR PAYLOAD:", tourData);

      const payload = {
        ...tourData,
        startdate: tourData.startdate || null,
        enddate: tourData.enddate || null,
        highlights: tourData.highlights.filter((item) =>
          item.highlight_value.trim(),
        ),
      };

      const response = await APIToken.post("/tour/add", payload);

      if (response.status === 201) {
        showToast("success", "Thêm mới tour thành công! 🎉");
        setTourData(createDefaultTourData());
      }
    } catch (error) {
      console.error("Add tour error:", error);

      showToast(
        "danger",
        error?.response?.data?.message ||
          "Không thể thêm tour. Vui lòng kiểm tra lại dữ liệu.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tour-add-page">
      <div className="tour-add-page-header">
        <div>
          <div className="tour-add-title-row">
            <h2>Thêm mới tour</h2>

            <Badge
              bg={completion === 100 ? "success" : "primary"}
              className="tour-add-completion-badge"
            >
              Hoàn thiện {completion}%
            </Badge>
          </div>

          <p>
            Nhập thông tin tour, giá bán, nội dung chương trình và hình ảnh
            trước khi đăng lên website.
          </p>
        </div>
      </div>

      <Row className="g-4">
        <Col xl={8} lg={8}>
          <div className="tour-add-card">
            <div className="tour-add-card-header">
              <div className="tour-add-card-title-wrap">
                <span className="tour-add-card-icon">
                  <FiFileText />
                </span>
                <div>
                  <h5>Thông tin cơ bản</h5>
                  <span>Thông tin chính hiển thị trên website</span>
                </div>
              </div>
            </div>

            <div className="tour-add-card-body">
              <div className="tour-add-group-switch">
                <div className="tour-add-group-switch-content">
                  <div className="tour-add-group-icon">
                    <FiUsers />
                  </div>

                  <div>
                    <strong>Tour dành cho khách đoàn</strong>
                    <span>
                      Bật tùy chọn này nếu đây là tour doanh nghiệp, bệnh viện,
                      ngân hàng hoặc đoàn riêng.
                    </span>
                  </div>
                </div>

                <Form.Check
                  type="switch"
                  id="tour-group-switch"
                  checked={tourData.isGroup}
                  onChange={handleGroupChange}
                  className="tour-add-switch"
                />
              </div>

              <div className="tour-add-field-group">
                <Form.Label className="tour-add-label">
                  Tên tour <span className="text-danger">*</span>
                </Form.Label>

                <Form.Control
                  className="tour-add-input tour-add-title-input"
                  type="text"
                  name="tourname"
                  value={tourData.tourname}
                  onChange={handleChange}
                  placeholder="Ví dụ: Tour Phan Thiết - Mũi Né 2N1Đ"
                />

                <div className="tour-add-help">
                  Nên ghi đầy đủ điểm đến và thời lượng để khách dễ nhận biết.
                </div>
              </div>

              <div className="tour-add-field-group">
                <Form.Label className="tour-add-label">
                  Đường dẫn tour
                </Form.Label>

                <div className="tour-add-slug-wrapper">
                  <span>/tour/</span>
                  <Form.Control
                    className="tour-add-input tour-add-slug-input"
                    type="text"
                    name="slug"
                    value={tourData.slug}
                    onChange={handleChange}
                    placeholder="phan-thiet-mui-ne-2n1d"
                  />
                </div>
              </div>

              <Row className="g-3">
                <Col md={6}>
                  <Form.Label className="tour-add-label">
                    Điểm khởi hành <span className="text-danger">*</span>
                  </Form.Label>

                  <Form.Select
                    className="tour-add-input"
                    name="departure"
                    value={tourData.departure}
                    onChange={handleChange}
                    disabled={loadingOptions}
                  >
                    <option value="">-- Chọn điểm khởi hành --</option>
                    {options.departures.map((item) => (
                      <option key={item.provinceid} value={item.provinceid}>
                        {item.provincename}
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                <Col md={6}>
                  <Form.Label className="tour-add-label">
                    Điểm đến <span className="text-danger">*</span>
                  </Form.Label>

                  <Form.Select
                    className="tour-add-input"
                    name="destination"
                    value={tourData.destination}
                    onChange={handleChange}
                    disabled={loadingOptions}
                  >
                    <option value="">-- Chọn điểm đến --</option>
                    {options.destinations.map((item) => (
                      <option
                        key={item.travellocationid}
                        value={item.travellocationid}
                      >
                        {item.travellocationname}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
            </div>
          </div>

          <div className="tour-add-card">
            <div className="tour-add-card-header">
              <div className="tour-add-card-title-wrap">
                <span className="tour-add-card-icon">
                  <FiCalendar />
                </span>
                <div>
                  <h5>Thời gian & dịch vụ</h5>
                  <span>Thiết lập thời lượng, ngày đi và dịch vụ tour</span>
                </div>
              </div>
            </div>

            <div className="tour-add-card-body">
              <Row className="g-3">
                <Col md={4}>
                  <Form.Label className="tour-add-label">
                    Loại thời gian <span className="text-danger">*</span>
                  </Form.Label>

                  <Form.Select
                    className="tour-add-input"
                    name="timetypeid"
                    value={tourData.timetypeid}
                    onChange={handleChange}
                    disabled={loadingOptions}
                  >
                    <option value="">-- Chọn --</option>
                    {options.timeTypes.map((item) => (
                      <option key={item.timetypeid} value={item.timetypeid}>
                        {item.timetypename}
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                <Col md={4}>
                  <Form.Label className="tour-add-label">
                    Ngày khởi hành
                  </Form.Label>
                  <Form.Control
                    className="tour-add-input"
                    type="date"
                    name="startdate"
                    value={tourData.startdate}
                    onChange={handleChange}
                  />
                </Col>

                <Col md={4}>
                  <Form.Label className="tour-add-label">Ngày về</Form.Label>
                  <Form.Control
                    className="tour-add-input"
                    type="date"
                    name="enddate"
                    min={tourData.startdate || undefined}
                    value={tourData.enddate}
                    onChange={handleChange}
                  />
                </Col>
              </Row>

              <Row className="g-3 mt-1">
                <Col md={6}>
                  <Form.Label className="tour-add-label">Loại nơi ở</Form.Label>
                  <Form.Select
                    className="tour-add-input"
                    name="hoteltypeid"
                    value={tourData.hoteltypeid}
                    onChange={handleChange}
                    disabled={loadingOptions}
                  >
                    <option value="">-- Chọn loại nơi ở --</option>
                    {options.hotelTypes.map((item) => (
                      <option key={item.hoteltypeid} value={item.hoteltypeid}>
                        {item.hoteltypename}
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                <Col md={6}>
                  <Form.Label className="tour-add-label">
                    Phương tiện
                  </Form.Label>
                  <Form.Select
                    className="tour-add-input"
                    name="vehicletypeid"
                    value={tourData.vehicletypeid}
                    onChange={handleChange}
                    disabled={loadingOptions}
                  >
                    <option value="">-- Chọn phương tiện --</option>
                    {options.vehicleTypes.map((item) => (
                      <option
                        key={item.vehicletypeid}
                        value={item.vehicletypeid}
                      >
                        {item.vehicletypename}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
            </div>
          </div>

          <div className="tour-add-card">
            <div className="tour-add-card-header">
              <div className="tour-add-card-title-wrap">
                <span className="tour-add-card-icon">
                  <FiDollarSign />
                </span>
                <div>
                  <h5>Giá tour</h5>
                  <span>Thiết lập giá bán theo độ tuổi</span>
                </div>
              </div>
            </div>

            <div className="tour-add-card-body">
              <Row className="g-3">
                <Col md={4}>
                  <Form.Label className="tour-add-label">
                    Người lớn / từ 11 tuổi
                  </Form.Label>

                  <div className="tour-add-money-input">
                    <Form.Control
                      className="tour-add-input"
                      type="number"
                      min="0"
                      value={tourData.price.adultprice}
                      onChange={(e) =>
                        handlePriceChange("adultprice", e.target.value)
                      }
                      placeholder="0"
                    />
                    <span>VNĐ</span>
                  </div>

                  {tourData.price.adultprice !== "" && (
                    <div className="tour-add-price-preview">
                      {formatCurrency(tourData.price.adultprice)} VNĐ
                    </div>
                  )}
                </Col>

                <Col md={4}>
                  <Form.Label className="tour-add-label">
                    Trẻ em từ 6 - 11 tuổi
                  </Form.Label>

                  <div className="tour-add-money-input">
                    <Form.Control
                      className="tour-add-input"
                      type="number"
                      min="0"
                      value={tourData.price.childprice}
                      onChange={(e) =>
                        handlePriceChange("childprice", e.target.value)
                      }
                      placeholder="0"
                    />
                    <span>VNĐ</span>
                  </div>

                  {tourData.price.childprice !== "" && (
                    <div className="tour-add-price-preview">
                      {formatCurrency(tourData.price.childprice)} VNĐ
                    </div>
                  )}
                </Col>

                <Col md={4}>
                  <Form.Label className="tour-add-label">
                    Trẻ em dưới 6 tuổi
                  </Form.Label>

                  <div className="tour-add-money-input">
                    <Form.Control
                      className="tour-add-input"
                      type="number"
                      min="0"
                      value={tourData.price.freeprice}
                      onChange={(e) =>
                        handlePriceChange("freeprice", e.target.value)
                      }
                      placeholder="0"
                    />
                    <span>VNĐ</span>
                  </div>

                  {tourData.price.freeprice !== "" && (
                    <div className="tour-add-price-preview">
                      {formatCurrency(tourData.price.freeprice)} VNĐ
                    </div>
                  )}
                </Col>
              </Row>
            </div>
          </div>

          <div className="tour-add-card">
            <div className="tour-add-card-header">
              <div className="tour-add-card-title-wrap">
                <span className="tour-add-card-icon">
                  <FiMapPin />
                </span>
                <div>
                  <h5>Điểm nổi bật</h5>
                  <span>Những lợi ích hoặc trải nghiệm nổi bật của tour</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline-primary"
                size="sm"
                className="tour-add-mini-button"
                onClick={handleAddHighlight}
              >
                <FiPlus /> Thêm điểm
              </Button>
            </div>

            <div className="tour-add-card-body">
              <div className="tour-add-highlight-list">
                {tourData.highlights.map((item, index) => (
                  <div className="tour-add-highlight-item" key={index}>
                    <span className="tour-add-highlight-number">
                      {index + 1}
                    </span>

                    <Form.Control
                      className="tour-add-input"
                      type="text"
                      value={item.highlight_value}
                      onChange={(e) =>
                        handleHighlightChange(index, e.target.value)
                      }
                      placeholder={`Ví dụ: Nghỉ dưỡng resort tiêu chuẩn cao cấp`}
                    />

                    <button
                      type="button"
                      className="tour-add-icon-button danger"
                      onClick={() => handleRemoveHighlight(index)}
                      title="Xóa điểm nổi bật"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="tour-add-card">
            <div className="tour-add-card-header">
              <div className="tour-add-card-title-wrap">
                <span className="tour-add-card-icon">
                  <FiFileText />
                </span>
                <div>
                  <h5>Mô tả ngắn</h5>
                  <span>Nội dung giới thiệu tour tại trang danh sách</span>
                </div>
              </div>

              <span
                className={`tour-add-char-count ${
                  tourData.description.length > 300 ? "warning" : ""
                }`}
              >
                {tourData.description.length} ký tự
              </span>
            </div>

            <div className="tour-add-card-body">
              <Form.Control
                className="tour-add-input tour-add-description"
                as="textarea"
                name="description"
                value={tourData.description}
                onChange={handleChange}
                rows={5}
                placeholder="Giới thiệu ngắn gọn về hành trình, trải nghiệm, đối tượng phù hợp..."
              />
            </div>
          </div>

          <div className="tour-add-card tour-add-editor-card">
            <div className="tour-add-card-header">
              <div className="tour-add-card-title-wrap">
                <span className="tour-add-card-icon">
                  <FiFileText />
                </span>
                <div>
                  <h5>Nội dung chi tiết</h5>
                  <span>Chương trình tour, dịch vụ bao gồm, lưu ý...</span>
                </div>
              </div>

              <div className="tour-add-auto-status">
                <span></span>
                Tự động ghi nhận
              </div>
            </div>

            <div className="tour-add-editor-wrap">
              <Word
                value={tourData.detailContent}
                onChange={handleContentChange}
              />
            </div>
          </div>
        </Col>

        <Col xl={4} lg={4}>
          <div className="tour-add-sidebar">
            <div className="tour-add-card tour-add-publish-card">
              <div className="tour-add-card-header">
                <div>
                  <h5>Đăng tour</h5>
                  <span>Kiểm tra thông tin trước khi tạo tour</span>
                </div>
              </div>

              <div className="tour-add-card-body">
                <div className="tour-add-check-list">
                  {requiredChecks.map((item, index) => (
                    <div
                      key={item.key}
                      className={`tour-add-check-item ${
                        item.done ? "completed" : ""
                      }`}
                    >
                      <span className="tour-add-check-icon">
                        {item.done ? <FiCheck /> : index + 1}
                      </span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="tour-add-submit"
                  onClick={handleAddTour}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-2" />
                      Đang tạo tour...
                    </>
                  ) : (
                    "ĐĂNG TOUR"
                  )}
                </Button>
              </div>
            </div>

            <div className="tour-add-card">
              <div className="tour-add-card-header">
                <div className="tour-add-card-title-wrap">
                  <span className="tour-add-card-icon">
                    <FiImage />
                  </span>
                  <div>
                    <h5>Ảnh đại diện</h5>
                    <span>Ảnh chính hiển thị ngoài danh sách tour</span>
                  </div>
                </div>
              </div>

              <div className="tour-add-card-body">
                <div
                  className={`tour-add-avatar-preview ${
                    avatar ? "has-image" : ""
                  }`}
                >
                  {avatar ? (
                    <>
                      <img src={avatar.imageurl} alt="Ảnh đại diện tour" />
                      <button
                        type="button"
                        className="tour-add-image-remove"
                        onClick={removeAvatar}
                        title="Xóa ảnh đại diện"
                      >
                        <FiTrash2 />
                      </button>
                    </>
                  ) : (
                    <div className="tour-add-image-empty">
                      <FiImage />
                      <strong>Chưa có ảnh đại diện</strong>
                      <span>Khuyến nghị ảnh ngang tỷ lệ 16:9</span>
                    </div>
                  )}
                </div>

                <div className="tour-add-upload-action">
                  <ImageCDNCloud onUploadSuccess={handleUploadSuccess} />
                </div>
              </div>
            </div>

            <div className="tour-add-card">
              <div className="tour-add-card-header">
                <div>
                  <h5>Thư viện ảnh</h5>
                  <span>{galleryImages.length} ảnh đã tải lên</span>
                </div>
              </div>

              <div className="tour-add-card-body">
                <div className="tour-add-upload-action top">
                  <ImageCDNCloud
                    onUploadSuccess={handleUploadImageListSuccess}
                  />
                </div>

                {galleryImages.length > 0 ? (
                  <div className="tour-add-gallery-grid">
                    {galleryImages.map((img, index) => (
                      <div className="tour-add-gallery-item" key={index}>
                        <img src={img.imageurl} alt={`Tour ${index + 1}`} />

                        <button
                          type="button"
                          className="tour-add-gallery-remove"
                          onClick={() => removeGalleryImage(index)}
                          title="Xóa ảnh"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="tour-add-gallery-empty">
                    <FiImage />
                    <span>Chưa có ảnh thư viện</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ position: "fixed", zIndex: 10000 }}
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

      {loading && (
        <div className="tour-add-loading-overlay">
          <div className="tour-add-loading-box">
            <Spinner animation="border" role="status" />
            <span>Đang tạo tour...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourAdd;
