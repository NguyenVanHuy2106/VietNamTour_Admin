import React, { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Button,
  Form,
  Toast,
  ToastContainer,
  Spinner,
  Badge,
} from "react-bootstrap";
import {
  FiArrowLeft,
  FiCheck,
  FiTrash2,
  FiImage,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiStar,
  FiSave,
} from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";

import Word from "../../components/Word";
import ImageCDNCloud from "../../components/ImageCDNCloud";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";

import "./index.css";

const TourEdit = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { tourId } = location.state || {};

  const userId = localStorage.getItem("userId");

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

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

  const [tourData, setTourData] = useState({
    tourid: "",
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
    updated_by: userId,
    images: [],
    detailContent: "",
    price: {
      adultprice: "",
      childprice: "",
      freeprice: "",
      promotion: 0,
    },
    highlights: [
      {
        highlight_key: 1,
        highlight_value: "",
      },
    ],
    isGroup: false,
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
     LOAD DROPDOWNS
  ===================================================== */

  const fetchOptions = async () => {
    try {
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
      console.error("Lỗi load dữ liệu dropdown:", error);

      showToast(
        "danger",
        "Không thể tải dữ liệu danh mục. Vui lòng tải lại trang.",
      );
    }
  };

  /* =====================================================
     LOAD TOUR DATA
  ===================================================== */

  const getData = async () => {
    if (!tourId) {
      showToast("danger", "Không tìm thấy Tour ID.");
      setLoadingData(false);
      return;
    }

    try {
      setLoadingData(true);

      const response = await API.get(`/tour/get/${tourId}`);

      const data = response.data.data || {};

      setTourData({
        tourid: data.tour?.tourid || "",

        tourname: data.tour?.tourname || "",

        slug: data.tour?.slug || "",

        description: data.tour?.description || "",

        destination: data.tour?.destination
          ? String(data.tour.destination)
          : "",

        departure: data.tour?.departure ? String(data.tour.departure) : "",

        timetypeid: data.tour?.timetypeid ? String(data.tour.timetypeid) : "",

        hoteltypeid: data.tour?.hoteltypeid
          ? String(data.tour.hoteltypeid)
          : "",

        startdate: data.tour?.startdate
          ? data.tour.startdate.split("T")[0]
          : "",

        enddate: data.tour?.enddate ? data.tour.enddate.split("T")[0] : "",

        vehicletypeid: data.tour?.vehicletypeid
          ? String(data.tour.vehicletypeid)
          : "",

        updated_by: userId,

        isGroup: data.tour?.tourtype === "DOAN",

        images: data.images || [],

        detailContent: data.detail?.content || "",

        price: {
          adultprice:
            data.price?.adultprice !== null &&
            data.price?.adultprice !== undefined
              ? data.price.adultprice
              : "",

          childprice:
            data.price?.childprice !== null &&
            data.price?.childprice !== undefined
              ? data.price.childprice
              : "",

          freeprice:
            data.price?.freeprice !== null &&
            data.price?.freeprice !== undefined
              ? data.price.freeprice
              : "",

          promotion:
            data.price?.promotion !== null &&
            data.price?.promotion !== undefined
              ? data.price.promotion
              : 0,
        },

        highlights:
          data.highlights?.length > 0
            ? data.highlights
            : [
                {
                  highlight_key: 1,
                  highlight_value: "",
                },
              ],
      });
    } catch (error) {
      console.error("Lỗi lấy tour:", error);

      showToast(
        "danger",
        error?.response?.data?.message || "Không thể tải thông tin tour.",
      );
    } finally {
      setLoadingData(false);
    }
  };

  /* =====================================================
     INIT
  ===================================================== */

  useEffect(() => {
    fetchOptions();
    getData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =====================================================
     FORM
  ===================================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setTourData((prev) => ({
      ...prev,
      [name]: value,
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

  /* =====================================================
     HIGHLIGHT
  ===================================================== */

  const handleHighlightChange = (index, value) => {
    setTourData((prev) => {
      const highlights = [...prev.highlights];

      highlights[index] = {
        ...highlights[index],
        highlight_value: value,
      };

      return {
        ...prev,
        highlights,
      };
    });
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

  const handleDeleteHighlight = (index) => {
    setTourData((prev) => {
      let highlights = prev.highlights.filter((_, idx) => idx !== index);

      if (highlights.length === 0) {
        highlights = [
          {
            highlight_key: 1,
            highlight_value: "",
          },
        ];
      }

      highlights = highlights.map((item, idx) => ({
        ...item,
        highlight_key: idx + 1,
      }));

      return {
        ...prev,
        highlights,
      };
    });
  };

  /* =====================================================
     IMAGE
  ===================================================== */

  const handleUploadSuccess = (url) => {
    setTourData((prev) => ({
      ...prev,

      images: [
        ...prev.images.filter((img) => Number(img.imagetype) !== 0),

        {
          imagename: "",
          imageurl: url,
          imagetype: 0,
        },
      ],
    }));
  };

  const handleUploadImageListSuccess = (url) => {
    setTourData((prev) => ({
      ...prev,

      images: [
        ...prev.images,

        {
          imagename: "New Image",
          imageurl: url,
          imagetype: 1,
        },
      ],
    }));
  };

  const handleDeleteImage = (imgToDelete) => {
    setTourData((prev) => ({
      ...prev,

      images: prev.images.filter(
        (img) => img.imageurl !== imgToDelete.imageurl,
      ),
    }));
  };

  const handleDeleteAvatar = () => {
    setTourData((prev) => ({
      ...prev,

      images: prev.images.filter((img) => Number(img.imagetype) !== 0),
    }));
  };

  /* =====================================================
     HELPERS
  ===================================================== */

  const mainImage = useMemo(() => {
    return tourData.images.find(
      (img) => Number(img.imagetype) === 0 && img.imageurl,
    );
  }, [tourData.images]);

  const galleryImages = useMemo(() => {
    return tourData.images.filter(
      (img) => Number(img.imagetype) === 1 && img.imageurl,
    );
  }, [tourData.images]);

  const formatMoney = (value) => {
    if (value === "" || value === null || value === undefined) {
      return "Chưa nhập";
    }

    return `${Number(value).toLocaleString("vi-VN")} VNĐ`;
  };

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
        label: "Tên tour",
        done: Boolean(tourData.tourname.trim()),
      },
      {
        label: "Điểm đến",
        done: Boolean(tourData.destination),
      },
      {
        label: "Điểm khởi hành",
        done: Boolean(tourData.departure),
      },
      {
        label: "Thời lượng",
        done: Boolean(tourData.timetypeid),
      },
      {
        label: "Nội dung chi tiết",
        done: !isContentEmpty(tourData.detailContent),
      },
      {
        label: "Ảnh đại diện",
        done: Boolean(mainImage),
      },
    ];

    const completed = checks.filter((item) => item.done).length;

    const percent = Math.round((completed / checks.length) * 100);

    return {
      checks,
      percent,
    };
  }, [tourData, mainImage]);

  /* =====================================================
     UPDATE TOUR
  ===================================================== */

  const handleUpdateTour = async () => {
    if (!tourData.tourname.trim()) {
      showToast("danger", "Vui lòng nhập tên tour.");
      return;
    }

    if (!tourData.destination) {
      showToast("danger", "Vui lòng chọn điểm đến.");
      return;
    }

    if (!tourData.departure) {
      showToast("danger", "Vui lòng chọn điểm khởi hành.");
      return;
    }

    /*
      Ngày KH và ngày về KHÔNG BẮT BUỘC.

      Chỉ kiểm tra khi cả hai đều có dữ liệu.
    */

    if (
      tourData.startdate &&
      tourData.enddate &&
      new Date(tourData.enddate) < new Date(tourData.startdate)
    ) {
      showToast("danger", "Ngày về không được nhỏ hơn ngày khởi hành.");
      return;
    }

    try {
      setLoading(true);

      /*
        Không có ngày => gửi null.
        Tránh gửi "" gây lỗi DATE ở PostgreSQL.
      */

      const payload = {
        ...tourData,

        startdate: tourData.startdate || null,

        enddate: tourData.enddate || null,

        highlights: tourData.highlights
          .filter((item) => item.highlight_value?.trim() !== "")
          .map((item, index) => ({
            ...item,
            highlight_key: index + 1,
            highlight_value: item.highlight_value.trim(),
          })),

        price: {
          adultprice:
            tourData.price.adultprice === ""
              ? null
              : Number(tourData.price.adultprice),

          childprice:
            tourData.price.childprice === ""
              ? null
              : Number(tourData.price.childprice),

          freeprice:
            tourData.price.freeprice === ""
              ? null
              : Number(tourData.price.freeprice),

          promotion:
            tourData.price.promotion === ""
              ? 0
              : Number(tourData.price.promotion || 0),
        },
      };

      console.log("UPDATE TOUR PAYLOAD:", payload);

      const response = await APIToken.post("/tour/update", payload);

      if (response.status === 200) {
        showToast("success", "Cập nhật thông tin tour thành công.");

        setTimeout(() => {
          navigate("/tour");
        }, 800);
      }
    } catch (error) {
      console.error("Lỗi cập nhật tour:", error);

      showToast(
        "danger",
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Không thể cập nhật tour.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     LOADING DATA
  ===================================================== */

  if (loadingData) {
    return (
      <div className="tour-edit-loading-page">
        <Spinner animation="border" />

        <span>Đang tải thông tin tour...</span>
      </div>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="tour-edit-page">
      {/* HEADER */}

      <div className="tour-edit-page-header">
        <div className="tour-edit-header-left">
          <button
            type="button"
            className="tour-edit-back-btn"
            onClick={() => navigate("/tour")}
          >
            <FiArrowLeft />
          </button>

          <div>
            <div className="tour-edit-title-row">
              <h2>Chỉnh sửa Tour</h2>

              {tourData.tourid && (
                <Badge bg="light" text="dark" className="tour-edit-id-badge">
                  ID #{tourData.tourid}
                </Badge>
              )}
            </div>

            <p>
              Cập nhật thông tin tour, giá, nội dung và hình ảnh hiển thị trên
              website.
            </p>
          </div>
        </div>

        <div className="tour-edit-header-status">
          Hoàn thiện <strong>{completionData.percent}%</strong>
        </div>
      </div>

      <Row className="g-4">
        {/* =====================================================
            LEFT
        ===================================================== */}

        <Col xl={8} lg={8}>
          {/* BASIC */}

          <div className="tour-edit-card">
            <div className="tour-edit-card-header">
              <div className="tour-edit-card-icon">
                <FiMapPin />
              </div>

              <div>
                <h5>Thông tin cơ bản</h5>

                <span>Tên tour, tuyến điểm và đường dẫn website</span>
              </div>
            </div>

            <div className="tour-edit-card-body">
              <div className="tour-edit-group-type">
                <div>
                  <strong>Tour dành cho khách đoàn</strong>

                  <span>
                    Sử dụng cho doanh nghiệp, bệnh viện, ngân hàng, đoàn thể...
                  </span>
                </div>

                <Form.Check
                  type="switch"
                  checked={tourData.isGroup}
                  onChange={(e) =>
                    setTourData((prev) => ({
                      ...prev,
                      isGroup: e.target.checked,
                    }))
                  }
                  className="tour-edit-group-switch"
                />
              </div>

              <div className="tour-edit-form-group">
                <Form.Label>
                  Tên tour
                  <span className="tour-required">*</span>
                </Form.Label>

                <Form.Control
                  className="tour-edit-input tour-edit-tourname"
                  type="text"
                  name="tourname"
                  value={tourData.tourname}
                  onChange={handleChange}
                  placeholder="VD: Tour Phan Thiết - Mũi Né 2N1Đ"
                />
              </div>

              <Row className="g-3">
                <Col md={6}>
                  <div className="tour-edit-form-group">
                    <Form.Label>
                      Điểm khởi hành
                      <span className="tour-required">*</span>
                    </Form.Label>

                    <Form.Select
                      className="tour-edit-input"
                      name="departure"
                      value={tourData.departure}
                      onChange={handleChange}
                    >
                      <option value="">-- Chọn điểm khởi hành --</option>

                      {options.departures.map((item) => (
                        <option key={item.provinceid} value={item.provinceid}>
                          {item.provincename}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="tour-edit-form-group">
                    <Form.Label>
                      Điểm đến
                      <span className="tour-required">*</span>
                    </Form.Label>

                    <Form.Select
                      className="tour-edit-input"
                      name="destination"
                      value={tourData.destination}
                      onChange={handleChange}
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
                  </div>
                </Col>
              </Row>

              <div className="tour-edit-form-group">
                <Form.Label>Đường dẫn (Slug)</Form.Label>

                <div className="tour-edit-slug-wrapper">
                  <span>/tour/</span>

                  <Form.Control
                    className="tour-edit-input"
                    type="text"
                    name="slug"
                    value={tourData.slug}
                    onChange={handleChange}
                    placeholder="phan-thiet-mui-ne-2n1d"
                  />
                </div>
              </div>

              <div className="tour-edit-form-group no-margin">
                <div className="tour-edit-label-row">
                  <Form.Label>Mô tả ngắn</Form.Label>

                  <span>{tourData.description.length} ký tự</span>
                </div>

                <Form.Control
                  className="tour-edit-input"
                  as="textarea"
                  rows={4}
                  name="description"
                  value={tourData.description}
                  onChange={handleChange}
                  placeholder="Mô tả ngắn về chương trình tour..."
                />
              </div>
            </div>
          </div>

          {/* SERVICE */}

          <div className="tour-edit-card">
            <div className="tour-edit-card-header">
              <div className="tour-edit-card-icon">
                <FiCalendar />
              </div>

              <div>
                <h5>Thời gian & dịch vụ</h5>

                <span>Thời lượng, ngày đi, lưu trú và phương tiện</span>
              </div>
            </div>

            <div className="tour-edit-card-body">
              <Row className="g-3">
                <Col md={4}>
                  <div className="tour-edit-form-group">
                    <Form.Label>Thời lượng</Form.Label>

                    <Form.Select
                      className="tour-edit-input"
                      name="timetypeid"
                      value={tourData.timetypeid}
                      onChange={handleChange}
                    >
                      <option value="">-- Chọn --</option>

                      {options.timeTypes.map((item) => (
                        <option key={item.timetypeid} value={item.timetypeid}>
                          {item.timetypename}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </Col>

                <Col md={4}>
                  <div className="tour-edit-form-group">
                    <Form.Label>Ngày khởi hành</Form.Label>

                    <Form.Control
                      className="tour-edit-input"
                      type="date"
                      name="startdate"
                      value={tourData.startdate || ""}
                      onChange={handleChange}
                    />

                    <div className="tour-edit-help">Không bắt buộc</div>
                  </div>
                </Col>

                <Col md={4}>
                  <div className="tour-edit-form-group">
                    <Form.Label>Ngày về</Form.Label>

                    <Form.Control
                      className="tour-edit-input"
                      type="date"
                      name="enddate"
                      value={tourData.enddate || ""}
                      onChange={handleChange}
                      min={tourData.startdate || undefined}
                    />

                    <div className="tour-edit-help">Không bắt buộc</div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="tour-edit-form-group no-margin">
                    <Form.Label>Loại lưu trú</Form.Label>

                    <Form.Select
                      className="tour-edit-input"
                      name="hoteltypeid"
                      value={tourData.hoteltypeid}
                      onChange={handleChange}
                    >
                      <option value="">-- Chọn loại lưu trú --</option>

                      {options.hotelTypes.map((item) => (
                        <option key={item.hoteltypeid} value={item.hoteltypeid}>
                          {item.hoteltypename}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="tour-edit-form-group no-margin">
                    <Form.Label>Phương tiện</Form.Label>

                    <Form.Select
                      className="tour-edit-input"
                      name="vehicletypeid"
                      value={tourData.vehicletypeid}
                      onChange={handleChange}
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
                  </div>
                </Col>
              </Row>
            </div>
          </div>

          {/* PRICE */}

          <div className="tour-edit-card">
            <div className="tour-edit-card-header">
              <div className="tour-edit-card-icon">
                <FiDollarSign />
              </div>

              <div>
                <h5>Giá tour</h5>

                <span>Thiết lập giá theo độ tuổi khách</span>
              </div>
            </div>

            <div className="tour-edit-card-body">
              <Row className="g-3">
                <Col md={4}>
                  <div className="tour-edit-price-box">
                    <span className="tour-edit-price-type">NGƯỜI LỚN</span>

                    <label>Từ 11 tuổi trở lên</label>

                    <div className="tour-edit-money-input">
                      <Form.Control
                        type="number"
                        min="0"
                        value={tourData.price.adultprice}
                        onChange={(e) =>
                          handlePriceChange("adultprice", e.target.value)
                        }
                      />

                      <span>VNĐ</span>
                    </div>

                    <div className="tour-edit-money-preview">
                      {formatMoney(tourData.price.adultprice)}
                    </div>
                  </div>
                </Col>

                <Col md={4}>
                  <div className="tour-edit-price-box">
                    <span className="tour-edit-price-type child">TRẺ EM</span>

                    <label>Từ 6 đến 11 tuổi</label>

                    <div className="tour-edit-money-input">
                      <Form.Control
                        type="number"
                        min="0"
                        value={tourData.price.childprice}
                        onChange={(e) =>
                          handlePriceChange("childprice", e.target.value)
                        }
                      />

                      <span>VNĐ</span>
                    </div>

                    <div className="tour-edit-money-preview">
                      {formatMoney(tourData.price.childprice)}
                    </div>
                  </div>
                </Col>

                <Col md={4}>
                  <div className="tour-edit-price-box">
                    <span className="tour-edit-price-type free">EM BÉ</span>

                    <label>Dưới 6 tuổi</label>

                    <div className="tour-edit-money-input">
                      <Form.Control
                        type="number"
                        min="0"
                        value={tourData.price.freeprice}
                        onChange={(e) =>
                          handlePriceChange("freeprice", e.target.value)
                        }
                      />

                      <span>VNĐ</span>
                    </div>

                    <div className="tour-edit-money-preview">
                      {formatMoney(tourData.price.freeprice)}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>

          {/* HIGHLIGHT */}

          <div className="tour-edit-card">
            <div className="tour-edit-card-header">
              <div className="tour-edit-card-icon">
                <FiStar />
              </div>

              <div>
                <h5>Điểm nổi bật của Tour</h5>

                <span>Những ưu điểm nổi bật hiển thị nhanh cho khách</span>
              </div>
            </div>

            <div className="tour-edit-card-body">
              <div className="tour-edit-highlight-list">
                {tourData.highlights.map((item, index) => (
                  <div className="tour-edit-highlight-row" key={index}>
                    <div className="tour-edit-highlight-number">
                      {index + 1}
                    </div>

                    <Form.Control
                      className="tour-edit-input"
                      type="text"
                      value={item.highlight_value}
                      placeholder={`VD: Nghỉ dưỡng resort 4 sao`}
                      onChange={(e) =>
                        handleHighlightChange(index, e.target.value)
                      }
                    />

                    <button
                      type="button"
                      className="tour-edit-delete-btn"
                      onClick={() => handleDeleteHighlight(index)}
                      title="Xóa điểm nổi bật"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline-primary"
                className="tour-edit-add-highlight"
                onClick={handleAddHighlight}
              >
                + Thêm điểm nổi bật
              </Button>
            </div>
          </div>

          {/* CONTENT */}

          <div className="tour-edit-card tour-edit-content-card">
            <div className="tour-edit-card-header">
              <div>
                <h5>Nội dung chi tiết</h5>

                <span>
                  Chương trình, lịch trình, dịch vụ bao gồm và chính sách Tour
                </span>
              </div>

              <div className="tour-edit-autosave">
                <span></span>
                Tự động ghi nhận
              </div>
            </div>

            <div className="tour-edit-word-wrapper">
              <Word
                value={tourData.detailContent}
                onChange={handleContentChange}
              />
            </div>
          </div>
        </Col>

        {/* =====================================================
            RIGHT SIDEBAR
        ===================================================== */}

        <Col xl={4} lg={4}>
          <div className="tour-edit-sidebar">
            {/* UPDATE */}

            <div className="tour-edit-card tour-edit-publish-card">
              <div className="tour-edit-card-header">
                <div>
                  <h5>Cập nhật Tour</h5>

                  <span>Kiểm tra thông tin trước khi lưu</span>
                </div>
              </div>

              <div className="tour-edit-card-body">
                <div className="tour-edit-progress-header">
                  <span>Mức độ hoàn thiện</span>

                  <strong>{completionData.percent}%</strong>
                </div>

                <div className="tour-edit-progress">
                  <div
                    style={{
                      width: `${completionData.percent}%`,
                    }}
                  ></div>
                </div>

                <div className="tour-edit-check-list">
                  {completionData.checks.map((item, index) => (
                    <div
                      key={index}
                      className={`tour-edit-check-item ${
                        item.done ? "completed" : ""
                      }`}
                    >
                      <span>{item.done ? <FiCheck /> : index + 1}</span>

                      {item.label}
                    </div>
                  ))}
                </div>

                <Button
                  className="tour-edit-submit-btn"
                  disabled={loading}
                  onClick={handleUpdateTour}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" />
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <FiSave />
                      CẬP NHẬT TOUR
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  className="tour-edit-cancel-btn"
                  onClick={() => navigate("/tour")}
                >
                  Hủy và quay lại
                </button>
              </div>
            </div>

            {/* AVATAR */}

            <div className="tour-edit-card">
              <div className="tour-edit-card-header">
                <div>
                  <h5>Ảnh đại diện</h5>

                  <span>Ảnh chính của Tour</span>
                </div>
              </div>

              <div className="tour-edit-card-body">
                {mainImage ? (
                  <div className="tour-edit-main-image">
                    <img src={mainImage.imageurl} alt="Ảnh đại diện tour" />

                    <button type="button" onClick={handleDeleteAvatar}>
                      <FiTrash2 />
                    </button>
                  </div>
                ) : (
                  <div className="tour-edit-image-placeholder">
                    <FiImage />

                    <strong>Chưa có ảnh đại diện</strong>

                    <span>Khuyến nghị ảnh ngang tỷ lệ 16:9</span>
                  </div>
                )}

                <div className="tour-edit-upload-area">
                  <ImageCDNCloud onUploadSuccess={handleUploadSuccess} />
                </div>
              </div>
            </div>

            {/* GALLERY */}

            <div className="tour-edit-card">
              <div className="tour-edit-card-header">
                <div>
                  <h5>Thư viện ảnh</h5>

                  <span>{galleryImages.length} ảnh trong Tour</span>
                </div>
              </div>

              <div className="tour-edit-card-body">
                <div className="tour-edit-upload-gallery">
                  <ImageCDNCloud
                    onUploadSuccess={handleUploadImageListSuccess}
                  />
                </div>

                {galleryImages.length > 0 ? (
                  <div className="tour-edit-gallery-grid">
                    {galleryImages.map((img, index) => (
                      <div
                        className="tour-edit-gallery-item"
                        key={`${img.imageurl}-${index}`}
                      >
                        <img src={img.imageurl} alt={`Tour ${index + 1}`} />

                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="tour-edit-gallery-empty">
                    Chưa có ảnh thư viện.
                  </div>
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
          zIndex: 10000,
        }}
      >
        <Toast
          bg={alertVariant}
          show={successAlertOpen}
          autohide
          delay={4000}
          onClose={() => setSuccessAlertOpen(false)}
        >
          <Toast.Header
            closeButton
            className="text-white"
            style={{
              backgroundColor: "rgba(0,0,0,.12)",
              borderBottom: 0,
            }}
          >
            <strong className="me-auto">Thông báo</strong>
          </Toast.Header>

          <Toast.Body className="text-white fw-bold">{alertMessage}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* UPDATE LOADING */}

      {loading && (
        <div className="tour-edit-loading-overlay">
          <div className="tour-edit-loading-box">
            <Spinner animation="border" />

            <span>Đang cập nhật Tour...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourEdit;
