// components/auth/AccountSecurityPage.jsx
import React, { useState, useContext, useEffect } from "react";
import AuthService from "../../services/AuthService";
import { AuthContext } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const AccountSecurityPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateUserContext, loading: authLoading } = useContext(AuthContext);

  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.isTwoFactorEnabled || false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setIs2FAEnabled(user.isTwoFactorEnabled || false);
    }
  }, [user]);

  const handleEnable2FA = () => {
    navigate("/2fa-setup");
  };

  const handleDisable2FA = async () => {
    // Adicionar confirmação antes de desabilitar
    if (!window.confirm(t("confirm_disable_2fa"))) {
      return;
    }
    setActionLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      await AuthService.disable2FA();
      // Atualizar o contexto do usuário
      const updatedUser = { ...user, isTwoFactorEnabled: false };
      updateUserContext(updatedUser);
      setIs2FAEnabled(false);
      setSuccessMessage(t("success_2fa_disabled"));
    } catch (err) {
      setError(t("error_2fa_disable_failed") + ": " + (err.response?.data?.message || err.message));
    }
    setActionLoading(false);
  };
  
  // Placeholder para funcionalidade de gerenciamento de códigos de recuperação
  const handleManageRecoveryCodes = () => {
    alert(t("alert_manage_recovery_codes_soon"));
    // Navegar para uma página específica ou mostrar um modal
  };

  if (authLoading) {
    return <p>{t("loading_account_security")}...</p>;
  }

  if (!user) {
    navigate("/login");
    return null; // Ou um loader enquanto redireciona
  }

  return (
    <div className="container mt-5">
      <h2>{t("title_account_security")}</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <div className="card p-4 mt-3">
        <h4>{t("title_2fa_status")}</h4>
        {is2FAEnabled ? (
          <p className="text-success">{t("status_2fa_enabled")}</p>
        ) : (
          <p className="text-muted">{t("status_2fa_disabled")}</p>
        )}

        {is2FAEnabled ? (
          <button 
            onClick={handleDisable2FA} 
            className="btn btn-danger mb-2" 
            disabled={actionLoading}
          >
            {actionLoading ? t("button_disabling") : t("button_disable_2fa")}
          </button>
        ) : (
          <button 
            onClick={handleEnable2FA} 
            className="btn btn-primary mb-2" 
            disabled={actionLoading}
          >
            {t("button_enable_2fa")}
          </button>
        )}
        
        {is2FAEnabled && (
            <button 
                onClick={handleManageRecoveryCodes} 
                className="btn btn-outline-secondary"
                disabled={actionLoading} // Pode ter seu próprio estado de loading
            >
                {t("button_manage_recovery_codes")}
            </button>
        )}
      </div>
      {/* Outras configurações de segurança podem ser adicionadas aqui */}
    </div>
  );
};

export default AccountSecurityPage;

