import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import API from "../../config/APINoToken";
import { Spinner } from "react-bootstrap";
import {
  FaRegClock,
  FaRegCalendarAlt,
  FaBus,
  FaInfo,
  FaRegBuilding,
  FaMapMarkerAlt,
  FaRegMap,
} from "react-icons/fa";

import "./index.css";

const TourDetail = () => {
  const location = useLocation();
  let userId = localStorage.getItem("userId");

  const { tourId } = location.state || {};
  const [dataTourDetail, setDataTourDetail] = useState([]);
  let [loading, setLoading] = useState(false);
  const [tourInfo, setTourInfo] = useState("");
  const [mainImage, setMainImage] = useState("");

  const [tourDetail, setTourDetail] = useState("");
  const [tourPrice, setTourPrice] = useState("");
  const [tourQuantity, setTourQuantity] = useState("");
  const [tourHighlight, setTourHighlight] = useState([]);

  const getData = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/tour/get/${tourId}`);
      setDataTourDetail(response.data.data || []);
      setTourInfo(response.data.data.tour);
      setTourDetail(response.data.data.detail);
      setTourPrice(response.data.data.price);
      setTourQuantity(response.data.data.quantity);
      setTourHighlight(response.data.data.highlights);
      const mainImg = response.data.data.images?.find(
        (img) => img.imagetype === 0
      );
      setMainImage(mainImg?.imageurl || ""); // fallback rỗng nếu không có ảnh
    } catch (error) {
      console.error(
        "Lỗi khi lấy danh sách loại Tour:",
        error.response || error
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getData();
  }, []);
  return (
    <div className="d-flex justify-content-center">
      <div
        style={{
          marginLeft: "50px",
          marginRight: "50px",
          width: "100%",
          maxWidth: "1250px",
          //   border: "1px solid #000000",
        }}
      >
        <div className="tourName">{tourInfo.tourname}</div>

        <div className="d-flex">
          <div style={{}}>
            <div>
              {mainImage && (
                <img
                  src={mainImage}
                  alt="VietNam Tour - image"
                  style={{ marginRight: 8, width: 770, height: 500 }}
                />
              )}
            </div>

            <div
              style={{
                marginTop: 10,
                maxWidth: 770, // Giới hạn vùng hiển thị ngang
                overflowX: "auto", // Bật cuộn ngang nếu nội dung quá rộng
                whiteSpace: "nowrap",
              }}
            >
              {dataTourDetail.images && Array.isArray(dataTourDetail.images)
                ? dataTourDetail.images.map((img, index) => (
                    <img
                      key={index}
                      className="imageContent"
                      src={img.imageurl}
                      alt={img.imagename || `image-${index}`}
                      style={{
                        paddingRight: 10,
                        width: 150,
                        height: 110,
                      }}
                      onClick={() => {
                        setMainImage(img.imageurl);
                      }}
                    />
                  ))
                : null}
            </div>
            <div className="BodyTour">
              <div>
                <div
                  style={{
                    color: "#1d61ad",
                    borderBottom: "1px solid #1d61ad",
                    fontWeight: "bold",
                    paddingBottom: "10px",
                    marginTop: "20px",
                  }}
                >
                  CHI TIẾT LỊCH TRÌNH
                </div>
                <div
                  className="tourDetail"
                  dangerouslySetInnerHTML={{ __html: tourDetail.content }}
                />
              </div>
            </div>
          </div>

          <div>
            <div>
              <div className="tourDetailInfo">
                <FaRegClock />
                <div className="tourDetailInfoText">
                  Thời gian: {dataTourDetail.timetype_name}
                </div>
              </div>
              <div className="tourDetailInfo">
                <FaRegCalendarAlt />
                <div className="tourDetailInfoText">
                  Ngày khởi hành: {tourInfo.startdate}
                </div>
              </div>
              <div className="tourDetailInfo">
                <FaBus />
                <div className="tourDetailInfoText">
                  Phương tiện: {dataTourDetail.vehicletype_name}
                </div>
              </div>
              {/* <div className="tourDetailInfo">
                <FaInfo />
                <div className="tourDetailInfoText">Loại tour</div>
              </div> */}
              <div className="tourDetailInfo">
                <FaRegBuilding />
                <div className="tourDetailInfoText">
                  Lưu trú: {dataTourDetail.hoteltypename}
                </div>
              </div>
              <div className="tourDetailInfo">
                <FaMapMarkerAlt />
                <div className="tourDetailInfoText">
                  Điểm khởi hành: {dataTourDetail.departure_name}
                </div>
              </div>
              <div className="tourDetailInfo">
                <FaRegMap />
                <div className="tourDetailInfoText">
                  Điểm đến: {dataTourDetail.destination_name}
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-center align-items-center tourDetailPrice">
              <div style={{ fontWeight: "bold" }}>Giá Tour:</div>
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: 30,
                  color: "#ff0000",
                  paddingLeft: "15px",
                }}
              >
                {tourPrice?.adultprice != null
                  ? tourPrice.adultprice.toLocaleString("vi-VN") + " ₫"
                  : "Đang cập nhật"}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontWeight: "bold",
                  color: "#1d61ad",
                  marginBottom: "15px",
                  borderBottom: "1px solid #1d61ad",
                  paddingBottom: "10px",
                  marginBottom: "20px",
                }}
              >
                ĐIỂM NỔI BẬT
              </div>
              <div className="tourHighlight">
                {tourHighlight.map((item, index) => (
                  <li key={index}>{item.highlight_value}</li>
                ))}
              </div>
            </div>
            <div className="d-flex">
              <div className="tourInfoOrderTour">ĐẶT TOUR</div>
              <div className="tourInfoOrder">TƯ VẤN</div>
            </div>
            <div className="tourInfoDes">{tourInfo.description}</div>
            <div>
              <div
                style={{
                  color: "#1d61ad",
                  borderBottom: "1px solid #1d61ad",
                  fontWeight: "bold",
                  paddingBottom: "10px",
                  marginTop: "20px",
                }}
              >
                CÁC TOUR LIÊN QUAN
              </div>
              <div className="RelativeTour">
                <div className="d-flex align-items-center">
                  <div>
                    <img
                      src="https://images.vietnamluxtour.com/uploads/1748759492692.png"
                      alt="VietNam Tour - image"
                      style={{ width: 220, height: 145, borderRadius: 10 }}
                    />
                  </div>
                  <div
                    className="d-flex flex-column"
                    style={{
                      marginLeft: 10,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: 13,
                        marginBottom: 10,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      PHÚ QUỐC - THIÊN ĐƯỜNG NGHỈ DƯỠNG, KHÁM PHÁ ĐẢO +
                      VINWWONDER 4N3Đ
                    </div>

                    <div>Khởi hành: TP. Hồ Chí Minh</div>

                    <div className="d-flex align-items-center">
                      <p>Giá Tour: </p>
                      <p
                        style={{
                          fontWeight: "bold",
                          color: "#ff0000",
                          fontSize: 20,
                          paddingLeft: 10,
                        }}
                      >
                        1.000.000
                      </p>
                    </div>
                    <div
                      className="d-flex justify-content-end"
                      style={{
                        marginTop: -15,
                        color: "#0000FF",
                        fontStyle: "italic",
                      }}
                    >
                      Chi tiết
                    </div>
                  </div>
                </div>
              </div>
              <div className="RelativeTour">
                <div className="d-flex align-items-center">
                  <div>
                    <img
                      src="https://images.vietnamluxtour.com/uploads/1748759492692.png"
                      alt="VietNam Tour - image"
                      style={{ width: 220, height: 145, borderRadius: 10 }}
                    />
                  </div>
                  <div
                    className="d-flex flex-column"
                    style={{
                      marginLeft: 10,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: 13,
                        marginBottom: 10,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      PHÚ QUỐC - THIÊN ĐƯỜNG NGHỈ DƯỠNG, KHÁM PHÁ ĐẢO +
                      VINWWONDER 4N3Đ
                    </div>

                    <div>Khởi hành: TP. Hồ Chí Minh</div>

                    <div className="d-flex align-items-center">
                      <p>Giá Tour: </p>
                      <p
                        style={{
                          fontWeight: "bold",
                          color: "#ff0000",
                          fontSize: 20,
                          paddingLeft: 10,
                        }}
                      >
                        1.000.000
                      </p>
                    </div>
                    <div
                      className="d-flex justify-content-end"
                      style={{
                        marginTop: -15,
                        color: "#0000FF",
                        fontStyle: "italic",
                      }}
                    >
                      Chi tiết
                    </div>
                  </div>
                </div>
              </div>
              <div className="RelativeTour">
                <div className="d-flex align-items-center">
                  <div>
                    <img
                      src="https://images.vietnamluxtour.com/uploads/1748759492692.png"
                      alt="VietNam Tour - image"
                      style={{ width: 220, height: 145, borderRadius: 10 }}
                    />
                  </div>
                  <div
                    className="d-flex flex-column"
                    style={{
                      marginLeft: 10,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: 13,
                        marginBottom: 10,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      PHÚ QUỐC - THIÊN ĐƯỜNG NGHỈ DƯỠNG, KHÁM PHÁ ĐẢO +
                      VINWWONDER 4N3Đ
                    </div>

                    <div>Khởi hành: TP. Hồ Chí Minh</div>

                    <div className="d-flex align-items-center">
                      <p>Giá Tour: </p>
                      <p
                        style={{
                          fontWeight: "bold",
                          color: "#ff0000",
                          fontSize: 20,
                          paddingLeft: 10,
                        }}
                      >
                        1.000.000
                      </p>
                    </div>
                    <div
                      className="d-flex justify-content-end"
                      style={{
                        marginTop: -15,
                        color: "#0000FF",
                        fontStyle: "italic",
                      }}
                    >
                      Chi tiết
                    </div>
                  </div>
                </div>
              </div>
              <div className="RelativeTour">
                <div className="d-flex align-items-center">
                  <div>
                    <img
                      src="https://images.vietnamluxtour.com/uploads/1748759492692.png"
                      alt="VietNam Tour - image"
                      style={{ width: 220, height: 145, borderRadius: 10 }}
                    />
                  </div>
                  <div
                    className="d-flex flex-column"
                    style={{
                      marginLeft: 10,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: 13,
                        marginBottom: 10,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      PHÚ QUỐC - THIÊN ĐƯỜNG NGHỈ DƯỠNG, KHÁM PHÁ ĐẢO +
                      VINWWONDER 4N3Đ
                    </div>

                    <div>Khởi hành: TP. Hồ Chí Minh</div>

                    <div className="d-flex align-items-center">
                      <p>Giá Tour: </p>
                      <p
                        style={{
                          fontWeight: "bold",
                          color: "#ff0000",
                          fontSize: 20,
                          paddingLeft: 10,
                        }}
                      >
                        1.000.000
                      </p>
                    </div>
                    <div
                      className="d-flex justify-content-end"
                      style={{
                        marginTop: -15,
                        color: "#0000FF",
                        fontStyle: "italic",
                      }}
                    >
                      Chi tiết
                    </div>
                  </div>
                </div>
              </div>
              <div className="RelativeTour">
                <div className="d-flex align-items-center">
                  <div>
                    <img
                      src="https://images.vietnamluxtour.com/uploads/1748759492692.png"
                      alt="VietNam Tour - image"
                      style={{ width: 220, height: 145, borderRadius: 10 }}
                    />
                  </div>
                  <div
                    className="d-flex flex-column"
                    style={{
                      marginLeft: 10,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: 13,
                        marginBottom: 10,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      PHÚ QUỐC - THIÊN ĐƯỜNG NGHỈ DƯỠNG, KHÁM PHÁ ĐẢO +
                      VINWWONDER 4N3Đ
                    </div>

                    <div>Khởi hành: TP. Hồ Chí Minh</div>

                    <div className="d-flex align-items-center">
                      <p>Giá Tour: </p>
                      <p
                        style={{
                          fontWeight: "bold",
                          color: "#ff0000",
                          fontSize: 20,
                          paddingLeft: 10,
                        }}
                      >
                        1.000.000
                      </p>
                    </div>
                    <div
                      className="d-flex justify-content-end"
                      style={{
                        marginTop: -15,
                        color: "#0000FF",
                        fontStyle: "italic",
                      }}
                    >
                      Chi tiết
                    </div>
                  </div>
                </div>
              </div>
              <div className="RelativeTour">
                <div className="d-flex align-items-center">
                  <div>
                    <img
                      src="https://images.vietnamluxtour.com/uploads/1748759492692.png"
                      alt="VietNam Tour - image"
                      style={{ width: 220, height: 145, borderRadius: 10 }}
                    />
                  </div>
                  <div
                    className="d-flex flex-column"
                    style={{
                      marginLeft: 10,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: 13,
                        marginBottom: 10,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      PHÚ QUỐC - THIÊN ĐƯỜNG NGHỈ DƯỠNG, KHÁM PHÁ ĐẢO +
                      VINWWONDER 4N3Đ
                    </div>

                    <div>Khởi hành: TP. Hồ Chí Minh</div>

                    <div className="d-flex align-items-center">
                      <p>Giá Tour: </p>
                      <p
                        style={{
                          fontWeight: "bold",
                          color: "#ff0000",
                          fontSize: 20,
                          paddingLeft: 10,
                        }}
                      >
                        1.000.000
                      </p>
                    </div>
                    <div
                      className="d-flex justify-content-end"
                      style={{
                        marginTop: -15,
                        color: "#0000FF",
                        fontStyle: "italic",
                      }}
                    >
                      Chi tiết
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner">
              <Spinner animation="border" role="status" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TourDetail;

const pickedData = [
  {
    id: 1,
    currentPrice: 29,
    currency: "VNĐ",
    stars: 4.6,
    city: "TP. HỒ CHÍ MINH",
    description: "The Phantom of the Opera",
    url: "https://cdn-imgix.headout.com/tour/652/TOUR-IMAGE/cd0fa708-27c2-4145-9fcf-14e84d910456-517-new-york-phantom-of-the-opera-00.jpg?auto=compress&fm=webp&w=510&h=315&crop=faces&fit=min",
    time: "3 ngày 3 đêm",
    date: "20/11/2025",
    vehicle: "Xe 45 chỗ",
    hotel: "Resort 4 sao",
  },
  {
    id: 2,
    currentPrice: 57.5,
    currency: "VNĐ",
    stars: 4.6,
    cashback: 10,
    city: "TP. HỒ CHÍ MINH",
    description: "Aladdin",
    url: "https://cdn-imgix.headout.com/tour/638/TOUR-IMAGE/d8da7ef3-6be5-4ab9-a88e-66a1cf8b5126-2.jpg?auto=compress&fm=webp&w=510&h=315&crop=faces&fit=min",
    time: "3 ngày 3 đêm",
    date: "20/11/2025",
    vehicle: "Xe 45 chỗ",
    hotel: "Resort 4 sao",
  },
  {
    id: 3,
    currentPrice: 40.5,
    lastPrice: 79,
    currency: "VNĐ",
    city: "TP. HỒ CHÍ MINH",
    description: "King Kong - Broadway Week Discount",
    url: "https://cdn-imgix.headout.com/tour/18201/TOUR-IMAGE/a24bde23-2e32-49d4-bf14-b933fe60fe52-c817b2f3-194d-4fde-9ad8-fccbaf50ed31-9339-new-york-king-kong-01.jpg?auto=compress&fm=webp&w=510&h=315&crop=faces&fit=min",
    time: "3 ngày 3 đêm",
    date: "20/11/2025",
    vehicle: "Xe 45 chỗ",
    hotel: "Resort 4 sao",
  },
  {
    id: 4,
    currentPrice: 141,
    lastPrice: 146,
    currency: "VNĐ",
    stars: 4.6,

    cashback: 5,
    city: "TP. HỒ CHÍ MINH",
    description: "Burj Khalifa: At the Top (Level 124 & 125)",
    url: "https://cdn-imgix.headout.com/tour/2636/TOUR-IMAGE/84609881-4697-4b73-bb46-9998b2fd7aa2-1866-dubai-burj-khalifa-at-the-top-01-4-.jpg?auto=compress&fm=webp&w=510&h=315&crop=faces&fit=min",
    time: "3 ngày 3 đêm",
    date: "20/11/2025",
    vehicle: "Xe 45 chỗ",
    hotel: "Resort 4 sao",
  },
  {
    id: 5,
    currentPrice: 196,
    lastPrice: 206,
    currency: "VNĐ",
    stars: 4.6,
    cashback: 5,
    city: "TP. HỒ CHÍ MINH",
    description: "Dubai Acquarium & Underwater Zoo + Burj Khalifa Combo",
    url: "https://cdn-imgix.headout.com/tour/3832/TOUR-IMAGE/4306765f-f03f-47a0-a5c5-241ae6cd49f6-2545-dubai-aquarium-underwater-zoo-burj-khalifa-combo-01.jpg?auto=compress&fm=webp&w=510&h=315&crop=faces&fit=min",
    time: "3 ngày 3 đêm",
    date: "20/11/2025",
    vehicle: "Xe 45 chỗ",
    hotel: "Resort 4 sao",
  },
  {
    id: 6,
    currentPrice: 20,
    currency: "VNĐ",
    stars: 4.6,
    city: "TP. HỒ CHÍ MINH",
    description:
      "Palace of Versailles All Access Passport Entry with Audioguide",
    url: "https://cdn-imgix.headout.com/tour/13905/TOUR-IMAGE/b23dc05c-1b19-4eb4-a205-fb9f0f2e29ab-7654-paris-Palace-of-Versailles-All-Access-Passport-Entry-with-Audioguide-01.jpg?auto=compress&fm=webp&w=510&h=315&crop=faces&fit=min",
    time: "3 ngày 3 đêm",
    date: "20/11/2025",
    vehicle: "Xe 45 chỗ",
    hotel: "Resort 4 sao",
  },
  {
    id: 7,
    currentPrice: 31,
    lastPrice: 45,
    currency: "VNĐ",
    stars: 4.6,
    cashback: 10,
    city: "TP. HỒ CHÍ MINH",
    description: "Skip The Line: Eiffel Tower Tickets with Host",
    url: "https://cdn-imgix.headout.com/tour/8092/TOUR-IMAGE/d9ee5fc2-5c9e-4981-8f4a-d16dc69769fd-P1.jpg?auto=compress&fm=webp&w=510&h=315&crop=faces&fit=min",
    time: "3 ngày 3 đêm",
    date: "20/11/2025",
    vehicle: "Xe 45 chỗ",
    hotel: "Resort 4 sao",
  },
  {
    id: 8,
    currentPrice: 31,
    lastPrice: 45,
    currency: "VNĐ",
    stars: 4.6,
    cashback: 10,
    city: "TP. HỒ CHÍ MINH",
    description: "Skip The Line: Eiffel Tower Tickets with Host",
    url: "https://cdn-imgix.headout.com/tour/8092/TOUR-IMAGE/d9ee5fc2-5c9e-4981-8f4a-d16dc69769fd-P1.jpg?auto=compress&fm=webp&w=510&h=315&crop=faces&fit=min",
    time: "3 ngày 3 đêm",
    date: "20/11/2025",
    vehicle: "Xe 45 chỗ",
    hotel: "Resort 4 sao",
  },
];
