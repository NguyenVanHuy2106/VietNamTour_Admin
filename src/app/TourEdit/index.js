import React, { useEffect, useState } from "react";
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
import Word from "../../components/Word";
import Form from "react-bootstrap/Form";

import ImageCDNCloud from "../../components/ImageCDNCloud";
import API from "../../config/APINoToken";
import APIToken from "../../config/APIToken";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { FiTrash } from "react-icons/fi";

const TourEdit = () => {
  const location = useLocation();
  const { tourId } = location.state || {};
  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const navigate = useNavigate();
  // const [isGroup, setIsGroup] = useState(false);
  // const [dataTourDetail, setDataTourDetail] = useState([]);
  // const [tourInfo, setTourInfo] = useState("");
  // const [mainImage, setMainImage] = useState("");

  // const [tourDetail, setTourDetail] = useState("");
  // const [tourPrice, setTourPrice] = useState("");
  // const [tourQuantity, setTourQuantity] = useState("");
  // const [tourHighlight, setTourHighlight] = useState([]);

  let userId = localStorage.getItem("userId");
  let [loading, setLoading] = useState(false);

  const [tourData, setTourData] = useState({
    tourid: "",
    tourname: "",
    slug: "",
    description: "",
    destination: "",
    departure: "",
    timetypeid: "",
    hoteltypeid: "",
    startdate: null,
    enddate: null,
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
    // quantity: {
    //   adult: "",
    //   child: "",
    //   free: "",
    // },
    highlights: [{ highlight_key: 1, highlight_value: "" }],
    isGroup: false,
  });
  const defaultTourData = {
    tourname: "",
    slug: "",
    description: "",
    destination: "",
    departure: "",
    timetypeid: "",
    hoteltypeid: "",
    startdate: null,
    enddate: null,
    vehicletypeid: "",
    updated_by: userId, // Giữ lại userId trong giá trị mặc định nếu cần
    images: [],
    detailContent: "",
    price: {
      adultprice: "",
      childprice: "",
      freeprice: "",
      promotion: 0,
    },
    // quantity: {
    //   adult: "",
    //   child: "",
    //   free: "",
    // },
    highlights: [{ highlight_key: 1, highlight_value: "" }],
    isGroup: false,
  };

  const [key, setKey] = useState("info");

  const [options, setOptions] = useState({
    destinations: [],
    departures: [],
    timeTypes: [],
    hotelTypes: [],
    vehicleTypes: [],
  });

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
        destinations: des.data.data,
        departures: dep.data.data,
        timeTypes: time.data.data,
        hotelTypes: hotel.data.data,
        vehicleTypes: vehicle.data.data,
      });
      //console.log(options);
      //setLoading(false);
    } catch (err) {
      console.error("Failed to fetch dropdown data", err);
    }
  };
  const getData = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/tour/get/${tourId}`);
      const data = response.data.data || {};

      // setDataTourDetail(data);
      // setTourInfo(data.tour);
      // setTourDetail(data.detail);
      // setTourPrice(data.price);
      // setTourQuantity(data.quantity);
      // setTourHighlight(data.highlights);
      // const mainImg = data.images?.find((img) => img.imagetype === 0);
      // setMainImage(mainImg?.imageurl || "");

      // Đổ dữ liệu vào tourData
      setTourData({
        tourid: data.tour?.tourid || "",
        tourname: data.tour?.tourname || "",
        slug: data.tour?.slug || "",
        description: data.tour?.description || "",
        destination: data.tour?.destination || "",
        departure: data.tour?.departure || "",
        timetypeid: data.tour?.timetypeid || "",
        hoteltypeid: data.tour?.hoteltypeid || "",
        startdate: data.tour?.startdate?.split("T")[0] || null,
        enddate: data.tour?.enddate?.split("T")[0] || null,
        vehicletypeid: data.tour?.vehicletypeid || "",
        updated_by: userId,
        isGroup: data.tour.tourtype === "DOAN" ? true : false,
        images: data.images || [],
        detailContent: data.detail.content || "",
        price: {
          adultprice: data.price?.adultprice || 0,
          childprice: data.price?.childprice || 0,
          freeprice: data.price?.freeprice || 0,
        },
        // Nếu bạn cần quantity thì thêm lại đoạn này
        // quantity: {
        //   adult: data.quantity?.adult || "",
        //   child: data.quantity?.child || "",
        //   free: data.quantity?.free || "",
        // },
        highlights: data.highlights?.length
          ? data.highlights
          : [{ highlight_key: 1, highlight_value: "" }],
      });
    } catch (error) {
      console.error(
        "Lỗi khi lấy danh sách loại Tour:",
        error.response || error
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "startdate" || name === "enddate") {
      setTourData((prev) => ({
        ...prev,
        [name]: value === "" ? null : value, // nếu xoá thì gán null
      }));
    } else {
      setTourData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleUpdateTour = async () => {
    //console.log(tourData);
    try {
      setLoading(true);
      const response = await APIToken.post("/tour/update", tourData);

      if (response.status === 200) {
        setAlertMessage("Cập nhật thông tin tour thành công");
        //setTourData(defaultTourData);
        setSuccessAlertOpen(true);

        // Đợi 2 giây rồi mới chuyển trang
        setTimeout(() => {
          navigate("/tour");
        }, 1000); // 2000ms = 2 giây
      }
    } catch (error) {
      return error;
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (field, value) => {
    setTourData((prev) => ({
      ...prev,
      quantity: { ...prev.quantity, [field]: value },
    }));
  };

  const handlePriceChange = (field, value) => {
    setTourData((prev) => ({
      ...prev,
      price: { ...prev.price, [field]: value },
    }));
  };

  const handleUploadSuccess = (url) => {
    setTourData((prevData) => ({
      ...prevData,
      images: [
        // Giữ tất cả hình có imagetype khác 0
        ...prevData.images.filter((img) => img.imagetype !== 0),
        // Thêm hình avatar mới
        {
          imagename: "", // Nếu cần thì thêm tên hình ở đây
          imageurl: url,
          imagetype: 0,
        },
      ],
    }));
  };
  const handleHighlightChange = (index, value) => {
    const newHighlights = [...tourData.highlights];
    newHighlights[index].highlight_value = value;
    setTourData({ ...tourData, highlights: newHighlights });
  };

  const handleAddHighlight = () => {
    setTourData({
      ...tourData,
      highlights: [
        ...tourData.highlights,
        {
          highlight_key: tourData.highlights.length + 1,
          highlight_value: "",
        },
      ],
    });
  };

  const handleUploadImageListSuccess = (newImageUrl) => {
    // Tạo đối tượng hình ảnh mới với imagetype = 1
    const newImage = {
      imagename: "New Image", // Bạn có thể thay thế bằng tên hình ảnh thực tế nếu có
      imageurl: newImageUrl, // Dùng newImageUrl làm đường dẫn hình ảnh
      imagetype: 1, // Gán imagetype = 1 cho hình ảnh mới
    };

    // Cập nhật mảng images trong tourData
    setTourData((prevData) => ({
      ...prevData,
      images: [...prevData.images, newImage], // Thêm hình vào cuối mảng images
    }));
  };
  const handleContentChange = (newContent) => {
    setTourData((prevData) => ({
      ...prevData,
      detailContent: newContent, // Cập nhật nội dung vào detailContent
    }));
    setAlertMessage("Lưu thông tin thành công");
    setSuccessAlertOpen(true);
  };
  const handleDeleteImage = (imgToDelete) => {
    const updatedImages = tourData.images.filter(
      (img) => img.imageurl !== imgToDelete.imageurl
    );
    setTourData((prevData) => ({
      ...prevData,
      images: updatedImages,
    }));
  };

  useEffect(() => {
    fetchOptions();
    getData();
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
        THÊM MỚI TOUR
      </div>
      <Tabs
        id="tour-add-tabs"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-3"
      >
        <Tab eventKey="info" title="Thông tin Tour">
          {/* Form nhập */}
          <Row>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <input
                type="checkbox"
                name="groupCustomer"
                checked={tourData.isGroup}
                onChange={(e) =>
                  setTourData({ ...tourData, isGroup: e.target.checked })
                }
                style={{ width: "20px", height: "20px", marginRight: "8px" }}
              />
              Khách đoàn
            </label>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <label>Điểm đến:</label>
              <select
                name="destination"
                className="form-control"
                value={tourData.destination}
                onChange={handleChange}
              >
                <option value="">-- Chọn --</option>
                {options.destinations.map((d) => (
                  <option key={d.travellocationid} value={d.travellocationid}>
                    {d.travellocationid + " - " + d.travellocationname}
                  </option>
                ))}
              </select>
            </Col>
            <Col md={6}>
              <label>Điểm khởi hành:</label>
              <select
                name="departure"
                className="form-control"
                value={tourData.departure}
                onChange={handleChange}
              >
                <option value="">-- Chọn --</option>
                {options.departures.map((d) => (
                  <option key={d.provinceid} value={d.provinceid}>
                    {d.provinceid + " - " + d.provincename}
                  </option>
                ))}
              </select>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Form.Label>Tên tour</Form.Label>
              <Form.Control
                type="text"
                name="tourname"
                value={tourData.tourname}
                onChange={handleChange}
              />
            </Col>

            <Col md={4}>
              <label>Loại nơi ở:</label>
              <select
                name="hoteltypeid"
                className="form-control"
                value={tourData.hoteltypeid}
                onChange={handleChange}
              >
                <option value="">-- Chọn --</option>
                {options.hotelTypes.map((t) => (
                  <option key={t.hoteltypeid} value={t.hoteltypeid}>
                    {t.hoteltypeid + " - " + t.hoteltypename}
                  </option>
                ))}
              </select>
            </Col>
            <Col md={4}>
              <label>Phương tiện:</label>
              <select
                name="vehicletypeid"
                className="form-control"
                value={tourData.vehicletypeid}
                onChange={handleChange}
              >
                <option value="">-- Chọn --</option>
                {options.vehicleTypes.map((t) => (
                  <option key={t.vehicletypeid} value={t.vehicletypeid}>
                    {t.vehicletypeid + " - " + t.vehicletypename}
                  </option>
                ))}
              </select>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col>
              <Form.Label>Slug (Đường dẫ thân thiện)</Form.Label>
              <Form.Control
                type="text"
                name="slug"
                value={tourData.slug}
                onChange={handleChange}
              />
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={4}>
              <label>Loại thời gian:</label>
              <select
                name="timetypeid"
                className="form-control"
                value={tourData.timetypeid}
                onChange={handleChange}
              >
                <option value="">-- Chọn --</option>
                {options.timeTypes.map((t) => (
                  <option key={t.timetypeid} value={t.timetypeid}>
                    {t.timetypename}
                  </option>
                ))}
              </select>
            </Col>
            <Col>
              <Form.Label>Ngày khởi hành</Form.Label>
              <Form.Control
                type="date"
                name="startdate"
                value={tourData.startdate}
                onChange={handleChange}
              />
            </Col>
            <Col>
              <Form.Label>Ngày về</Form.Label>
              <Form.Control
                type="date"
                name="enddate"
                value={tourData.enddate}
                onChange={handleChange}
              />
            </Col>
          </Row>

          {/* <Row className="mb-3">
            <Col>
              <Form.Label>SL Người lớn</Form.Label>
              <Form.Control
                type="number"
                value={tourData.quantity.adult}
                onChange={(e) =>
                  handleQuantityChange("adult", Number(e.target.value))
                }
              />
            </Col>
            <Col>
              <Form.Label>SL Trẻ em</Form.Label>
              <Form.Control
                type="number"
                value={tourData.quantity.child}
                onChange={(e) =>
                  handleQuantityChange("child", Number(e.target.value))
                }
              />
            </Col>
            <Col>
              <Form.Label>SL Miễn phí</Form.Label>
              <Form.Control
                type="number"
                value={tourData.quantity.free}
                onChange={(e) =>
                  handleQuantityChange("free", Number(e.target.value))
                }
              />
            </Col>
          </Row> */}

          <Row className="mb-3">
            <Col>
              <Form.Label>Giá vé từ 11t trở lên</Form.Label>
              <Form.Control
                type="number"
                step="any"
                value={tourData.price.adultprice}
                onChange={(e) =>
                  handlePriceChange("adultprice", Number(e.target.value))
                }
              />
            </Col>
            <Col>
              <Form.Label>Giá vé từ 6-11t</Form.Label>
              <Form.Control
                type="number"
                step="any"
                value={tourData.price.childprice}
                onChange={(e) =>
                  handlePriceChange("childprice", Number(e.target.value))
                }
              />
            </Col>
            <Col>
              <Form.Label>Giá vé nhỏ hơn 6t </Form.Label>
              <Form.Control
                type="number"
                step="any"
                value={tourData.price.freeprice}
                onChange={(e) =>
                  handlePriceChange("freeprice", Number(e.target.value))
                }
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Label>Điểm nổi bật của tour</Form.Label>
              {tourData.highlights.map((h, idx) => (
                <Form.Control
                  key={idx}
                  className="mb-2"
                  type="text"
                  placeholder={`Điểm nổi bật ${idx + 1}`}
                  value={h.highlight_value}
                  onChange={(e) => handleHighlightChange(idx, e.target.value)}
                />
              ))}
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleAddHighlight}
              >
                + Thêm điểm nổi bật
              </Button>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Label>Mô tả ngắn</Form.Label>
              <Form.Control
                as="textarea" // Đổi thành textarea
                name="description"
                value={tourData.description}
                onChange={handleChange}
                rows={5} // Số dòng, có thể thay đổi theo ý muốn
                style={{ resize: "both", minHeight: "150px" }}
              />
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="word" title="Nội dung chi tiết">
          <Row className="mb-3">
            {tourData.detailContent !== undefined && (
              <Word
                value={tourData.detailContent}
                onSave={handleContentChange}
              />
            )}
          </Row>
        </Tab>

        <Tab eventKey="image" title="Danh sách hình ảnh">
          {/* Tab 2: Word Editor */}
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
                {tourData.images.find(
                  (img) => img.imagetype === 0 && img.imageurl
                ) ? (
                  <img
                    src={
                      tourData.images.find(
                        (img) => img.imagetype === 0 && img.imageurl
                      ).imageurl
                    }
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
            <Col>
              <div>
                <div className="d-flex mt-3">
                  <div style={{ marginRight: 10 }}>Chọn ảnh: </div>
                  <ImageCDNCloud
                    onUploadSuccess={handleUploadImageListSuccess}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    marginTop: 20,
                  }}
                >
                  {tourData.images.filter((img) => img.imagetype === 1).length >
                  0 ? (
                    tourData.images
                      .filter((img) => img.imagetype === 1)
                      .map((img, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: "relative",
                            width: 150,
                            height: 150,
                          }}
                        >
                          <img
                            src={img.imageurl}
                            alt={`Selected file ${idx}`}
                            width={150}
                            height={150}
                            style={{
                              objectFit: "cover",
                              border: "1px #000000 dashed",
                            }}
                          />
                          <FiTrash
                            onClick={() => handleDeleteImage(img)}
                            size={20}
                            color="white"
                            style={{
                              position: "absolute",
                              top: 5,
                              right: 5,
                              backgroundColor: "rgba(255,0,0,0.8)",
                              borderRadius: "50%",
                              padding: 4,
                              cursor: "pointer",
                            }}
                            title="Xoá ảnh"
                          />
                        </div>
                      ))
                  ) : (
                    <div
                      style={{
                        width: 150,
                        height: 150,
                        border: "1px #000000 dashed",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <p>Chọn ảnh</p>
                    </div>
                  )}
                </div>
              </div>
            </Col>
          </Row>
          <Row>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button variant="primary" onClick={handleUpdateTour}>
                Thêm Tour
              </Button>
            </div>
          </Row>
        </Tab>
      </Tabs>
      <Toast
        onClose={() => setSuccessAlertOpen(false)}
        show={successAlertOpen}
        delay={3000}
        autohide
        className="position-fixed top-0 end-0 m-3"
      >
        <Toast.Body>{alertMessage}</Toast.Body>
      </Toast>
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <Spinner animation="border" role="status" />
          </div>
        </div>
      )}
    </Container>
  );
};

export default TourEdit;
