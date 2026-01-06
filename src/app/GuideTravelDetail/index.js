import React, { useState, useEffect } from "react";
import API from "../../config/APINoToken";
import { useLocation } from "react-router-dom";
import { FaCalendarAlt, FaUser, FaTag, FaChevronRight } from "react-icons/fa";
import { Spinner, Toast, ToastContainer } from "react-bootstrap";
import "./index.css";

const GuideTravelDetail = () => {
  const location = useLocation();
  const { postId } = location.state || {};
  const [dataPostDetail, setDataPostDetail] = useState({});
  const [dataTag, setDataTag] = useState([]);
  const [dataCreator, setDataCreator] = useState({});
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);

  const getData = async () => {
    if (!postId) return;
    try {
      setLoading(true);
      const response = await API.get(`/post/${postId}`);
      const postData = response.data.data;
      setDataPostDetail(postData || {});
      setDataTag(postData?.tags || []);
      setDataCreator(postData?.creator || {});
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết bài viết:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
    window.scrollTo(0, 0);
  }, [postId]);

  if (loading) {
    return (
      <div className="gtd-loading-container">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang tải nội dung bài viết...</p>
      </div>
    );
  }

  return (
    <div className="gtd-wrapper">
      <div className="container py-4">
        <div className="row">
          {/* CỘT TRÁI: NỘI DUNG CHI TIẾT */}
          <div className="col-lg-9 col-md-12">
            <div className="gtd-main-content">
              {/* Ảnh bìa bài viết */}
              {dataPostDetail.thumbnail_url && (
                <div className="gtd-banner">
                  <img
                    src={dataPostDetail.thumbnail_url}
                    alt={dataPostDetail.title}
                  />
                  <div className="gtd-category-badge">
                    {dataPostDetail.category_name || "Cẩm nang"}
                  </div>
                </div>
              )}

              <div className="gtd-body-padding">
                {/* Tiêu đề bài viết */}
                <h1 className="gtd-title">{dataPostDetail.title}</h1>

                {/* Meta info */}
                <div className="gtd-meta-bar">
                  <div className="gtd-meta-item">
                    <FaCalendarAlt /> <span>{dataPostDetail.created_at}</span>
                  </div>
                  <div className="gtd-meta-item">
                    <FaUser /> <span>{dataCreator?.name || "Admin"}</span>
                  </div>
                </div>

                {/* Tags bài viết */}
                {dataTag.length > 0 && (
                  <div className="gtd-tags-container">
                    <FaTag className="tag-icon" />
                    {dataTag.map((tag) => (
                      <span key={tag.tag_id} className="gtd-tag-item">
                        #{tag.tag_name}
                      </span>
                    ))}
                  </div>
                )}

                <hr />

                {/* Mô tả ngắn */}
                <div className="gtd-description-box">
                  {dataPostDetail.description}
                </div>

                {/* Nội dung chi tiết (Render HTML từ Word component) */}
                <div
                  className="gtd-article-body"
                  dangerouslySetInnerHTML={{ __html: dataPostDetail.content }}
                />
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: BÀI VIẾT LIÊN QUAN */}
          <div className="col-lg-3 col-md-12">
            <div className="gtd-sidebar">
              <div className="gtd-sidebar-title">BÀI VIẾT LIÊN QUAN</div>

              {/* Card bài viết liên quan mẫu (Lấy dữ liệu thật nếu có API bài liên quan) */}
              <div className="gtd-related-card">
                <div className="gtd-related-img">
                  <img src={dataPostDetail.thumbnail_url} alt="Related" />
                </div>
                <div className="gtd-related-info">
                  <h4 className="gtd-related-title">{dataPostDetail.title}</h4>
                  <div className="gtd-related-meta">
                    <FaCalendarAlt size={12} />{" "}
                    <span>{dataPostDetail.created_at}</span>
                  </div>
                  <button
                    className="gtd-read-more"
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    Xem thêm <FaChevronRight size={10} />
                  </button>
                </div>
              </div>

              {/* Box trang trí/quảng cáo */}
              <div className="gtd-sidebar-ad">
                <h5>Khám phá ngay!</h5>
                <p>Hàng ngàn tour du lịch hấp dẫn đang chờ đón bạn.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast dính góc phải trên */}
      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ position: "fixed", zIndex: 9999 }}
      >
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          bg="info"
        >
          <Toast.Body className="text-white">
            Dữ liệu bài viết đã được cập nhật!
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default GuideTravelDetail;
