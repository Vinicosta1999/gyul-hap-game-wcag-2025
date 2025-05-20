// components/auth/TwoFactorSetupPage.jsx
import React, { useState, useEffect, useContext } from "react";
import QRCode from "qrcode.react";
import AuthService from "../../services/AuthService"; // Assumindo que AuthService será atualizado
import { AuthContext } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const TwoFactorSetupPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); // Para verificar se o usuário já tem 2FA

  const [secret, setSecret] = useState("");
  const [otpAuthUrl, setOtpAuthUrl] = useState("");
  const [qrCodeVisible, setQrCodeVisible] = useState(false);
  const [totpToken, setTotpToken] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [step, setStep] = useState(1); // 1: Iniciar, 2: Verificar, 3: Códigos de Recuperação
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verificar se o usuário já tem 2FA habilitado e redirecionar ou mostrar status
    if (user && user.isTwoFactorEnabled) {
      // Idealmente, esta página não seria acessível ou mostraria uma mensagem diferente
      // navigate("/account-security"); 
      setError(t("error_2fa_already_enabled"));
      setStep(0); // Bloqueia a configuração
      return;
    }
    handleInitiateSetup();
  }, [user, t, navigate]);

  const handleInitiateSetup = async () => {
    setLoading(true);
    setError("");
    try {
      // AuthService.setup2FA() deve ser implementado para chamar o backend
      const data = await AuthService.setup2FA(); 
      setSecret(data.secret);
      setOtpAuthUrl(data.otpAuthUrl);
      setQrCodeVisible(true);
      setStep(1); // Pronto para escanear e verificar
    } catch (err) {
      setError(t("error_2fa_setup_failed") + ": " + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  const handleVerifySetup = async (e) => {
    e.preventDefault();
    if (!totpToken) {
      setError(t("error_totp_required"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      // AuthService.verify2FASetup(totpToken) deve ser implementado
      const data = await AuthService.verify2FASetup(totpToken);
      setRecoveryCodes(data.recoveryCodes || []);
      setStep(2); // Mostrar códigos de recuperação
      // Atualizar o contexto do usuário para refletir que 2FA está habilitado
      // Idealmente, o AuthContext teria uma função para recarregar os dados do usuário
    } catch (err) {
      setError(t("error_2fa_verify_failed") + ": " + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  const handleProceedToAccount = () => {
    navigate("/profile"); // Ou para a página de segurança da conta
  };
  
  if (loading && step === 1 && !qrCodeVisible) {
      return <p>{t("loading_2fa_setup")}...</p>;
  }

  return (
    <div className="container mt-5">
      <h2>{t("title_2fa_setup")}</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      {step === 0 && (
        <button onClick={() => navigate("/profile")} className="btn btn-primary">
          {t("button_back_to_account")}
        </button>
      )}

      {step === 1 && qrCodeVisible && (
        <div className="card p-4">
          <p>{t("info_scan_qr_or_use_secret")}</p>
          <div className="text-center my-3">
            <QRCode value={otpAuthUrl} size={256} level="H" />
          </div>
          <p>
            <strong>{t("label_manual_secret")}:</strong> <code className="user-select-all">{secret}</code>
          </p>
          <hr />
          <form onSubmit={handleVerifySetup}>
            <div className="form-group">
              <label htmlFor="totpToken">{t("label_enter_totp_code")}</label>
              <input
                type="text"
                className="form-control"
                id="totpToken"
                value={totpToken}
                onChange={(e) => setTotpToken(e.target.value)}
                maxLength={6}
                required
                autoComplete="one-time-code"
                pattern="\d{6}"
                title={t("title_totp_format")}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading || !totpToken}>
              {loading ? t("button_verifying") : t("button_verify_enable_2fa")}
            </button>
          </form>
        </div>
      )}

      {step === 2 && (
        <div className="card p-4">
          <h4>{t("title_2fa_enabled_success")}</h4>
          <p className="text-danger">{t("info_store_recovery_codes_safely")}</p>
          <ul className="list-group mb-3">
            {recoveryCodes.map((code, index) => (
              <li key={index} className="list-group-item user-select-all"><code>{code}</code></li>
            ))}
          </ul>
          <p>{t("info_recovery_codes_one_time")}</p>
          <button onClick={handleProceedToAccount} className="btn btn-success">
            {t("button_proceed_to_account")}
          </button>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetupPage;

