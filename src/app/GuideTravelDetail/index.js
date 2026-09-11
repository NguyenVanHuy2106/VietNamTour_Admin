import React, { useEffect, useMemo, useState } from "react";
import API from "../../config/APINoToken";
import { useLocation, useNavigate } from "react-router-dom";

import {
  FaCalendarAlt,
  FaUser,
  FaTag,
  FaChevronRight,
  FaFolderOpen,
} from "react-icons/fa";

import { FiArrowLeft, FiEdit2, FiClock, FiFileText } from "react-icons/fi";

import { Spinner } from "react-bootstrap";

import "./index.css";

const GuideTravelDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { postId } = location.state || {};

  const [dataPostDetail, setDataPostDetail] = useState({});
  const [dataTag, setDataTag] = useState([]);
  const [dataCreator, setDataCreator] = useState({});
  const [relatedPosts, setRelatedPosts] = useState([]);

  const [loading, setLoading] = useState(true);

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (dateValue) => {
    if (!dateValue) return "Chưa cập nhật";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  /* =====================================================
     GET POST DETAIL
  ===================================================== */

  const getData = async () => {
    if (!postId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await API.get(`/post/${postId}`);

      const postData = response.data.data || {};

      setDataPostDetail(postData);

      setDataTag(postData?.tags || []);

      setDataCreator(postData?.creator || {});
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết bài viết:", error);
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     RELATED POSTS
  ===================================================== */

  const getRelatedPosts = async () => {
    try {
      const response = await API.get("/post/get");

      const posts = response.data.data || [];

      /*
        Ưu tiên:
        - Không lấy bài hiện tại
        - Cùng category
        - Tối đa 4 bài
      */

      const sameCategory = posts.filter(
        (post) =>
          Number(post.post_id) !== Number(postId) &&
          Number(post.category_id) === Number(dataPostDetail.category_id),
      );

      /*
        Nếu category API list không trả category_id
        thì fallback lấy các bài khác.
      */

      const fallback = posts.filter(
        (post) => Number(post.post_id) !== Number(postId),
      );

      setRelatedPosts(
        (sameCategory.length > 0 ? sameCategory : fallback).slice(0, 4),
      );
    } catch (error) {
      console.error("Lỗi lấy bài viết liên quan:", error);
    }
  };

  /* =====================================================
     INIT
  ===================================================== */

  useEffect(() => {
    getData();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [postId]);

  useEffect(() => {
    if (dataPostDetail?.post_id) {
      getRelatedPosts();
    }
  }, [dataPostDetail?.post_id]);

  /* =====================================================
     WORD COUNT / READING TIME
  ===================================================== */

  const readingInfo = useMemo(() => {
    const html = dataPostDetail?.content || "";

    const text = html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const words = text ? text.split(/\s+/).length : 0;

    const minutes = Math.max(1, Math.ceil(words / 220));

    return {
      words,
      minutes,
    };
  }, [dataPostDetail?.content]);

  /* =====================================================
     NAVIGATE
  ===================================================== */

  const handleGoToEdit = () => {
    navigate("/guide-travel-edit", {
      state: {
        postId: dataPostDetail.post_id,
      },
    });
  };

  const handleGoToRelated = (post_id) => {
    navigate("/guide-travel-detail", {
      state: {
        postId: post_id,
      },
    });
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="gtd-loading-container">
        <div className="gtd-loading-box">
          <Spinner animation="border" variant="primary" />

          <div>
            <strong>Đang tải bài viết</strong>

            <span>Vui lòng chờ trong giây lát...</span>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     EMPTY
  ===================================================== */

  if (!dataPostDetail?.post_id) {
    return (
      <div className="gtd-empty-page">
        <FiFileText />

        <h4>Không tìm thấy bài viết</h4>

        <p>Bài viết có thể đã bị xoá hoặc đường dẫn không còn tồn tại.</p>

        <button onClick={() => navigate("/guide-travel-list")}>
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="gtd-wrapper">
      <div className="gtd-container">
        {/* =================================================
            TOP BAR
        ================================================= */}

        <div className="gtd-topbar">
          <button className="gtd-back-button" onClick={() => navigate(-1)}>
            <FiArrowLeft />

            <span>Quay lại</span>
          </button>

          <button className="gtd-edit-button" onClick={handleGoToEdit}>
            <FiEdit2 />
            Chỉnh sửa bài viết
          </button>
        </div>

        <div className="gtd-layout">
          {/* =================================================
              MAIN CONTENT
          ================================================= */}

          <main className="gtd-main">
            <article className="gtd-article-card">
              {/* =============================================
                  ARTICLE HEADER
              ============================================= */}

              <div className="gtd-article-header">
                {/* CATEGORY */}

                <div className="gtd-category-label">
                  <FaFolderOpen />

                  {dataPostDetail.category_name || "Cẩm nang du lịch"}
                </div>

                {/* TITLE */}

                <h1 className="gtd-title">{dataPostDetail.title}</h1>

                {/* DESCRIPTION */}

                {dataPostDetail.description && (
                  <p className="gtd-lead">{dataPostDetail.description}</p>
                )}

                {/* META */}

                <div className="gtd-meta">
                  <div className="gtd-meta-item">
                    <FaCalendarAlt />

                    <span>{formatDate(dataPostDetail.created_at)}</span>
                  </div>

                  <div className="gtd-meta-item">
                    <FaUser />

                    <span>
                      {dataCreator?.name ||
                        dataCreator?.fullname ||
                        dataPostDetail.created_by ||
                        "Admin"}
                    </span>
                  </div>

                  <div className="gtd-meta-item">
                    <FiClock />

                    <span>{readingInfo.minutes} phút đọc</span>
                  </div>
                </div>
              </div>

              {/* =============================================
                  COVER
              ============================================= */}

              {dataPostDetail.thumbnail_url && (
                <div className="gtd-cover">
                  <img
                    src={dataPostDetail.thumbnail_url}
                    alt={dataPostDetail.title}
                  />
                </div>
              )}

              {/* =============================================
                  CONTENT
              ============================================= */}

              <div className="gtd-content-wrapper">
                <div
                  className="gtd-article-body"
                  dangerouslySetInnerHTML={{
                    __html: dataPostDetail.content || "",
                  }}
                />

                {/* TAG */}

                {dataTag.length > 0 && (
                  <div className="gtd-tags-section">
                    <div className="gtd-tags-title">
                      <FaTag />
                      Tags
                    </div>

                    <div className="gtd-tags">
                      {dataTag.map((tag) => (
                        <span key={tag.tag_id} className="gtd-tag">
                          #{tag.tag_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>
          </main>

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside className="gtd-sidebar">
            {/* =============================================
                ARTICLE INFO
            ============================================= */}

            <div className="gtd-sidebar-card">
              <div className="gtd-sidebar-heading">Thông tin bài viết</div>

              <div className="gtd-info-list">
                <div className="gtd-info-row">
                  <span>Mã bài</span>

                  <strong>#{dataPostDetail.post_id}</strong>
                </div>

                <div className="gtd-info-row">
                  <span>Danh mục</span>

                  <strong>{dataPostDetail.category_name || "—"}</strong>
                </div>

                <div className="gtd-info-row">
                  <span>Số từ</span>

                  <strong>{readingInfo.words.toLocaleString("vi-VN")}</strong>
                </div>

                <div className="gtd-info-row">
                  <span>Thời gian đọc</span>

                  <strong>{readingInfo.minutes} phút</strong>
                </div>
              </div>
            </div>

            {/* =============================================
                RELATED POSTS
            ============================================= */}

            <div className="gtd-sidebar-card">
              <div className="gtd-sidebar-title-row">
                <div>
                  <div className="gtd-sidebar-heading">Bài viết liên quan</div>

                  <span>Có thể bạn quan tâm</span>
                </div>
              </div>

              <div className="gtd-related-list">
                {relatedPosts.length > 0 ? (
                  relatedPosts.map((post) => (
                    <button
                      type="button"
                      className="gtd-related-card"
                      key={post.post_id}
                      onClick={() => handleGoToRelated(post.post_id)}
                    >
                      <div className="gtd-related-img">
                        <img
                          src={
                            post.thumbnail_url ||
                            "https://via.placeholder.com/300x180"
                          }
                          alt={post.title}
                        />
                      </div>

                      <div className="gtd-related-content">
                        <h4>{post.title}</h4>

                        <div className="gtd-related-date">
                          <FaCalendarAlt />

                          {formatDate(post.created_at)}
                        </div>

                        <div className="gtd-related-link">
                          Xem bài viết
                          <FaChevronRight />
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="gtd-related-empty">
                    Chưa có bài viết liên quan.
                  </div>
                )}
              </div>
            </div>

            {/* =============================================
                TOUR CTA
            ============================================= */}

            <div className="gtd-tour-box">
              <span>VIET NAM TOUR</span>

              <h4>Khám phá những hành trình hấp dẫn</h4>

              <p>
                Tour đoàn, team building, MICE và chương trình du lịch dành cho
                doanh nghiệp.
              </p>

              <button onClick={() => navigate("/tour")}>
                Xem danh sách Tour
                <FaChevronRight />
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default GuideTravelDetail;
