// src/pages/user/resetPass/resetPass.tsx
import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "@/styles/pages/user/resetPass.scss";

const API_BASE = "http://localhost:5000/api/auth";

const ResetPassPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // link sẽ có dạng ?tokenizer=abc123...
  const navigate = useNavigate();

  const [step, setStep] = useState<"email" | "newpass" | "success">(
    token ? "newpass" : "email"
  );

  // Bước 1: Nhập email để gửi link
  const [email, setEmail] = useState("");
  const [loading1, setLoading1] = useState(false);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Vui lòng nhập email hợp lệ");
      return;
    }

    setLoading1(true);
    try {
      const res = await fetch(`${API_BASE}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gửi thất bại");

      toast.success("Đã gửi link đặt lại mật khẩu vào email của bạn!");
      setStep("success");
    } catch (err: any) {
      toast.error(err.message || "Không tìm thấy email này");
    } finally {
      setLoading1(false);
    }
  };

  // Bước 2: Nhập mật khẩu mới
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading2, setLoading2] = useState(false);

  const handleResetPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) {
      toast.error("Mật khẩu phải từ 6 ký tự trở lên");
      return;
    }
    if (newPass !== confirmPass) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading2(true);
    try {
      const res = await fetch(`${API_BASE}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: newPass }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Link không hợp lệ");

      toast.success("Đặt lại mật khẩu thành công! Đang chuyển về đăng nhập...");
      setTimeout(() => navigate("/tai-khoan-ca-nhan"), 2000);
    } catch (err: any) {
      toast.error(err.message || "Link đã hết hạn hoặc không hợp lệ");
    } finally {
      setLoading2(false);
    }
  };

  return (
    <div className="reset-pass-page">
      <div className="reset-container">
        <h2>
          {step === "email" && "Quên mật khẩu"}
          {step === "newpass" && "Đặt lại mật khẩu"}
          {step === "success" && "Kiểm tra email"}
        </h2>

        {/* Bước 1: Nhập email */}
        {step === "email" && (
          <form onSubmit={handleSendLink} className="reset-form">
            <p>Nhập email bạn đã dùng để đăng ký tài khoản</p>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={loading1}>
              {loading1 ? "Đang gửi..." : "Gửi link đặt lại"}
            </button>
            <div className="back-login">
              <Link to="/tai-khoan-ca-nhan">← Quay lại đăng nhập</Link>
            </div>
          </form>
        )}

        {/* Bước 2: Nhập mật khẩu mới */}
        {step === "newpass" && (
          <form onSubmit={handleResetPass} className="reset-form">
            <p>Vui lòng nhập mật khẩu mới</p>
            <input
              type="password"
              placeholder="Mật khẩu mới"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Nhập lại mật khẩu"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              required
            />
            <button type="submit" disabled={loading2}>
              {loading2 ? "Đang xử lý..." : "Xác nhận"}
            </button>
          </form>
        )}

        {/* Bước 3: Đã gửi email */}
        {step === "success" && (
          <div className="success-message">
            <p>Link đặt lại mật khẩu đã được gửi đến:</p>
            <strong>{email}</strong>
            <p>Vui lòng kiểm tra hộp thư (và cả thư rác/spam) nhé!</p>
            <Link to="/tai-khoan-ca-nhan" className="btn-back">
              ← Quay lại đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassPage;