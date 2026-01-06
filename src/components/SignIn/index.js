import React, { useState } from "react";
import API from "../../config/APINoToken";
import { Button, Container, Form, Alert, Spinner } from "react-bootstrap";

export default function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Reset lỗi cũ

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("/user/login", {
        user_id: username,
        password: password,
      });

      if (response.data && response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userId", username);
        window.location.href = "/";
      } else {
        setError("Không nhận được token từ hệ thống.");
      }
    } catch (err) {
      console.error("Login Error:", err);
      // Hiển thị lỗi cụ thể để người dùng biết tại sao thất bại
      setError(
        err.response?.data?.message || "Tên đăng nhập hoặc mật khẩu không đúng!"
      );
    } finally {
      // ĐÂY LÀ DÒNG QUAN TRỌNG: Dù thành công hay thất bại cũng phải tắt loading
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        // Hình nền du lịch (Vịnh Hạ Long hoặc phong cảnh VN)
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1600')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Container
        style={{
          maxWidth: "400px",
          background: "rgba(255, 255, 255, 0.92)",
          borderRadius: "20px",
          padding: "40px 30px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          textAlign: "center",
          backdropFilter: "blur(5px)",
        }}
      >
        <div className="mb-4">
          <img
            src="https://cdn.myvietnamtour.vn/uploads/1.png"
            alt="Logo Công Ty Du Lịch"
            width="110"
            className="mb-2"
          />
          <h4
            className="fw-bold"
            style={{ color: "#0056b3", letterSpacing: "1px" }}
          >
            HỆ THỐNG QUẢN LÝ
          </h4>
          <p className="text-muted small">Chào mừng bạn quay trở lại!</p>
        </div>

        {error && (
          <Alert
            variant="danger"
            className="py-2 small border-0 mb-3"
            style={{ borderRadius: "10px" }}
          >
            {error}
          </Alert>
        )}

        <Form noValidate validated={validated} onSubmit={handleLogin}>
          <Form.Group className="mb-3 text-start">
            <Form.Control
              required
              type="text"
              placeholder="Tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                borderRadius: "12px",
                height: "50px",
                border: "1px solid #ced4da",
                paddingLeft: "15px",
              }}
            />
            <Form.Control.Feedback type="invalid">
              Vui lòng nhập tài khoản.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-4 text-start">
            <Form.Control
              required
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                borderRadius: "12px",
                height: "50px",
                border: "1px solid #ced4da",
                paddingLeft: "15px",
              }}
            />
            <Form.Control.Feedback type="invalid">
              Vui lòng nhập mật khẩu.
            </Form.Control.Feedback>
          </Form.Group>

          <Button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "50px",
              borderRadius: "12px",
              fontWeight: "bold",
              background: "linear-gradient(45deg, #007bff, #00d4ff)",
              border: "none",
              boxShadow: "0 4px 15px rgba(0, 123, 255, 0.3)",
            }}
          >
            {loading ? (
              <Spinner size="sm" animation="border" />
            ) : (
              "ĐĂNG NHẬP NGAY"
            )}
          </Button>

          <div className="mt-4">
            <p className="small text-muted">
              Gặp sự cố đăng nhập? <br />
              <a
                href="#"
                style={{
                  color: "#007bff",
                  fontWeight: "bold",
                  textDecoration: "none",
                }}
              >
                Liên hệ bộ phận IT
              </a>
            </p>
          </div>
        </Form>
      </Container>
    </div>
  );
}
