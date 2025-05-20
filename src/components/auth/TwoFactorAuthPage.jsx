// components/auth/TwoFactorAuthPage.jsx
import React, { useState, useContext } from "react";
import AuthService from "../../services/AuthService";
import { AuthContext } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const TwoFactorAuthPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login: contextLogin } = useContext(AuthContext);

  // O userId/email deve ser passado do LoginForm através do estado da rota ou de um contexto temporário
  const { userId } = location.state || {}; 

  const [code, setCode] = useState("");
  const [isRecovery, setIsRecovery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!userId) {
    // Se não houver userId, o usuário não deveria estar nesta página.
    // Redirecionar para o login ou mostrar um erro.
    navigate("/login");
    // Poderia também setError(t("error_2fa_flow_invalid")); e não renderizar o formulário
    return <p>{t("error_2fa_flow_invalid_redirecting")}</p>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code) {
      setError(t(isRecovery ? "error_recovery_code_required" : "error_totp_required"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await AuthService.loginWith2FA(userId, code, isRecovery);
      contextLogin(data.user); // Atualiza o contexto com o usuário logado
      navigate("/profile"); // Ou para a página principal do jogo/dashboard
    } catch (err) {
      setError(t("error_2fa_auth_failed") + ": " + (err.response?.data?.message || err.message || t("error_invalid_2fa_code")));
    }
    setLoading(false);
  };

  return (
    <div className="container mt-5">
      <div className="col-md-6 offset-md-3">
        <div className="card card-container p-4">
          <h4>{t(isRecovery ? "title_enter_recovery_code" : "title_enter_2fa_code")}</h4>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="2fa-code">{t(isRecovery ? "label_recovery_code" : "label_authenticator_code")}</label>
              <input
                type="text"
                className="form-control"
                id="2fa-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={isRecovery ? 12 : 6} // Ajustar conforme o tamanho do código de recuperação
                required
                autoComplete="one-time-code"
                pattern={isRecovery ? "[a-zA-Z0-9]{8,12}" : "\\d{6}"}
                title={t(isRecovery ? "title_recovery_code_format" : "title_totp_format")}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading || !code}>
              {loading ? t("button_verifying") : t("button_submit_code")}
            </button>
          </form>
          <hr />
          <button 
            className="btn btn-link btn-sm" 
            onClick={() => setIsRecovery(!isRecovery)}
          >
            {t(isRecovery ? "link_use_totp_code" : "link_use_recovery_code")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuthPage;

