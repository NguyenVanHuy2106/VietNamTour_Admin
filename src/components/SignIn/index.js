import React, { useState } from "react";
import API from "../../config/APINoToken";

import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Avatar,
} from "@mui/material";
import { LockOutlined } from "@mui/icons-material";

export default function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [dataSignIn, setDataSignIn] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Gửi yêu cầu đăng nhập với thông tin username và password
      const response = await API.post("/user/login", {
        user_id: username,
        password: password,
      });

      // Kiểm tra nếu đăng nhập thành công và có token
      if (response.data.token) {
        // Lưu token vào localStorage
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userId", username);
        //console.log("Đăng nhập thành công:", response.data);

        // Chuyển hướng người dùng đến trang chủ (hoặc trang nào bạn muốn)
        window.location.href = "/"; // Hoặc bạn có thể dùng React Router để điều hướng
      } else {
        console.error("Không có token trong phản hồi.");
      }
    } catch (error) {
      console.error(
        "Lỗi khi đăng nhập:",
        error.response?.data || error.message
      );
    }
  };

  return (
    <div
      component="main"
      maxWidth="xs"
      style={{
        border: "1px #000000 solid",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      >
        <source
          src="https://cdn.pixabay.com/video/2022/07/14/124156-730195498_large.mp4"
          type="video/mp4"
        />
        Trình duyệt của bạn không hỗ trợ video.
      </video>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          borderRadius: "10px",
          width: "40%",
          position: "relative",
          zIndex: 1,
          paddingLeft: 2,
          paddingRight: 2,
        }}
      >
        <div className="logoClass mb-4 mt-3">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/core-pilates-e0144.firebasestorage.app/o/LOGO%20VIETNAM%20TOUR.png?alt=media&token=1072008e-42cf-45c8-a23f-ad1817f428f7"
            alt="React Logo"
            width="100"
          />
        </div>
        <Typography component="h1" variant="h5">
          Đăng Nhập
        </Typography>
        <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1 }}>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="username"
            label="Tên đăng nhập"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Mật khẩu"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Đăng Nhập
          </Button>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Typography
              variant="body2"
              color="text.secondary"
              className="d-flex"
            >
              Chưa có tài khoản?{"    "}
              <p href="#" style={{ textDecoration: "none", color: "#1976d2" }}>
                Liên hệ IT ngay
              </p>
            </Typography>
          </Box>
        </Box>
      </Box>
    </div>
  );
}
