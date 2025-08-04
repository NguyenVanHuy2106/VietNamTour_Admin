import React, { useState } from "react";
import API from "../../config/APINoToken";
import { Button, Container, Form, Image, Row, Col } from "react-bootstrap";

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
      style={{
        border: "1px #000000 solid",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
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

      <Container
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          borderRadius: "10px",
          width: "40%",
          position: "relative",
          zIndex: 1,
          paddingLeft: "2rem",
          paddingRight: "2rem",
          paddingTop: "2rem",
          paddingBottom: "2rem",
        }}
      >
        <div className="logoClass mb-4 mt-3">
          <img
            src="https://images.vietnamluxtour.com/uploads/1.png"
            alt="React Logo"
            width="100"
          />
        </div>
        <h1>Đăng Nhập</h1>
        <Form onSubmit={handleLogin} noValidate>
          <Form.Group controlId="username" className="mb-3">
            <Form.Label>Tên đăng nhập</Form.Label>
            <Form.Control
              type="text"
              placeholder="Nhập tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                height: "50px", // Tăng chiều cao của trường
                width: "400px",
              }}
              required
            />
          </Form.Group>
          <Form.Group controlId="password" className="mb-3">
            <Form.Label>Mật khẩu</Form.Label>
            <Form.Control
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                height: "50px", // Tăng chiều cao của trường
                width: "400px",
              }}
              required
            />
          </Form.Group>
          <div className="d-flex justify-content-center">
            <Button
              type="submit"
              fullWidth
              variant="primary"
              style={{ marginTop: "1rem", marginBottom: "1rem" }}
            >
              Đăng Nhập
            </Button>
          </div>
          <Row style={{ display: "flex", justifyContent: "center" }}>
            <Col>
              <p style={{ color: "gray", textAlign: "center" }}>
                Chưa có tài khoản?{" "}
                <a
                  href="#"
                  style={{
                    textDecoration: "none",
                    color: "#1976d2",
                    fontWeight: "bold",
                  }}
                >
                  Liên hệ IT ngay
                </a>
              </p>
            </Col>
          </Row>
        </Form>
      </Container>
    </div>
  );
}
