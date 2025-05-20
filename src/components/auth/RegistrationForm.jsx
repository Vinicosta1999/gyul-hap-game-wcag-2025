// RegistrationForm.jsx (com validação avançada de entrada)
import React, { useState, useContext } from "react";
import AuthService from "../../services/AuthService";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Simulação de biblioteca de validação (ex: Yup ou Zod)
const validateRegistrationForm = (values) => {
  const errors = {};
  if (!values.username) {
    errors.username = "error_username_required";
  } else if (values.username.length < 3 || values.username.length > 30) {
    errors.username = "error_username_length";
  } else if (!/^[a-zA-Z0-9_-]+$/.test(values.username) || /^[_-]/.test(values.username) || /[_-]$/.test(values.username)) {
    errors.username = "error_username_invalid_chars";
  }

  if (!values.email) {
    errors.email = "error_email_required";
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
    errors.email = "error_email_invalid";
  }

  if (!values.password) {
    errors.password = "error_password_required";
  } else if (values.password.length < 8) {
    errors.password = "error_password_length";
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~])/.test(values.password)) {
    errors.password = "error_password_complexity";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "error_confirm_password_required";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "error_passwords_mismatch";
  }
  return errors;
};

const RegistrationForm = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrors({});

    const formValues = { username, email, password, confirmPassword };
    const validationErrors = validateRegistrationForm(formValues);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await AuthService.register(username, email, password);
      setMessage(t("success_registration"));
      // Opcional: redirecionar para login ou mostrar mensagem para verificar email
      setTimeout(() => {
        navigate("/login");
      }, 3000); // Redireciona após 3 segundos
    } catch (error) {
      const resMessage = error.message || error.toString();
      setMessage(t("error_registration_failed") + (resMessage.includes("NetworkError") ? t("error_network") : resMessage));
      // Mapear erros específicos do backend para chaves de tradução se possível
      if (resMessage.includes("Username already exists")) {
        setErrors({ username: "error_username_exists" });
      } else if (resMessage.includes("Email already in use")) {
        setErrors({ email: "error_email_exists" });
      }
    }
    setLoading(false);
  };

  return (
    <div className="col-md-12">
      <div className="card card-container">
        <img
          src="//ssl.gstatic.com/accounts/ui/avatar_2x.png"
          alt="profile-img"
          className="profile-img-card"
        />
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="username">{t("username")}</label>
            <input
              type="text"
              className={`form-control ${errors.username ? "is-invalid" : ""}`}
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-describedby="usernameError"
            />
            {errors.username && (
              <div id="usernameError" className="invalid-feedback">{t(errors.username)}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">{t("email")}</label>
            <input
              type="text"
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-describedby="emailError"
            />
            {errors.email && (
              <div id="emailError" className="invalid-feedback">{t(errors.email)}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">{t("password")}</label>
            <input
              type="password"
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="passwordError"
            />
            {errors.password && (
              <div id="passwordError" className="invalid-feedback">{t(errors.password)}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">{t("confirm_password")}</label>
            <input
              type="password"
              className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-describedby="confirmPasswordError"
            />
            {errors.confirmPassword && (
              <div id="confirmPasswordError" className="invalid-feedback">{t(errors.confirmPassword)}</div>
            )}
          </div>

          <div className="form-group">
            <button className="btn btn-primary btn-block" disabled={loading}>
              {loading && (
                <span className="spinner-border spinner-border-sm"></span>
              )}
              <span>{t("register")}</span>
            </button>
          </div>

          {message && (
            <div className={`form-group ${errors && Object.keys(errors).length > 0 ? "alert alert-danger" : "alert alert-success"}`} role="alert">
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;

