import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

const APIToken = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm interceptor để tự động gắn token vào header mỗi lần gửi request
APIToken.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Hoặc lấy từ sessionStorage hoặc cookie

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`; // Thêm token vào header Authorization
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default APIToken;
