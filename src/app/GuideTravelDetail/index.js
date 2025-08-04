import React, { useState, useEffect } from "react";

import API from "../../config/APINoToken";
import { useLocation } from "react-router-dom";
import "./index.css";
import { FaCalendarAlt, FaUser } from "react-icons/fa";

const GuideTravelDetail = () => {
  const location = useLocation();
  const { postId } = location.state || {};
  const [dataPostDetail, setDataPostDetail] = useState([]);
  const [dataTag, setDataTag] = useState([]);
  const [dataCreator, setDataCreator] = useState({});
  let [loading, setLoading] = useState(false);

  const [blogPost, setBlogPost] = useState({
    title: "Giới thiệu về Tailwind CSS - Một framework CSS tiện ích",
    shortDescription:
      "Tìm hiểu cách sử dụng Tailwind CSS để xây dựng giao diện người dùng nhanh chóng và hiệu quả mà không cần viết CSS tùy chỉnh.",
    featuredImage:
      "https://placehold.co/1200x600/60A5FA/1E40AF?text=Ảnh+Đại+Diện+Blog",
    category: "Thiết kế Web",
    tags: ["Tailwind CSS", "CSS", "Frontend", "Lập trình"],
  });
  const getData = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/post/${postId}`);
      setDataPostDetail(response.data.data || []);
      setDataTag(response.data.data.tags || []);
      setDataCreator(response.data.data.creator);
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
    <div className="container d-flex">
      <div className="bg-gray-50 font-sans text-gray-800 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 col-9">
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Tiêu đề */}
          <div className="title">{dataPostDetail.title}</div>
          <div className="ContainerCombo">
            <div className="combo">
              <FaCalendarAlt />
              {dataPostDetail.created_at}
            </div>
            <div className="combo">
              <FaUser />
              {dataCreator.name}
            </div>
          </div>
          <div className="ContainerCombo">
            {dataTag.length > 0 ? (
              <div className="d-flex flex-wrap">
                {dataTag.map((tag) => (
                  <div className="TagDetail" key={tag.tag_id}>
                    {tag.tag_name}
                  </div>
                ))}
              </div>
            ) : (
              <span>""</span>
            )}
          </div>
          <div className="p-6 sm:p-8 md:p-10">
            {/* Mô tả ngắn */}
            <p className="description">{dataPostDetail.description}</p>

            {/* Phần nội dung có thể được thêm vào đây nếu cần */}
            <div
              className=""
              dangerouslySetInnerHTML={{ __html: dataPostDetail.content }}
            />
          </div>
        </div>
      </div>
      <div className="col-3">
        <div className="titleRelation">BÀI VIẾT LIÊN QUAN</div>
        <div className="card">
          <img
            src={dataPostDetail.thumbnail_url}
            alt={blogPost.title}
            className="card-img"
          />
          <div className="card-title">{dataPostDetail.title}</div>

          <div className="card-meta">
            <div className="combo">
              <FaCalendarAlt />
              <span>{dataPostDetail.created_at}</span>
            </div>
            <div className="combo">
              <FaUser />
              <span>{dataCreator.name}</span>
            </div>
          </div>

          <div className="card-description">{dataPostDetail.description}</div>
        </div>
      </div>
    </div>
  );
};

export default GuideTravelDetail;
