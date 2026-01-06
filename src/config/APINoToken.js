import axios from "axios";

const API_BASE_URL = "https://service.myvietnamtour.vn/api";

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;
