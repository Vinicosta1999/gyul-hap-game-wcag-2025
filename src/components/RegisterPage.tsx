import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom"; // Importar useNavigate
import { useTranslation } from "react-i18next";

const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate(); // Hook para navegação
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Corrigir para usar import.meta.env para variáveis de ambiente em Vite
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError(t("register_error_password_mismatch"));
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("register_failed_default_error"));
      }

      setSuccessMessage(t("register_success_message"));
      setTimeout(() => {
        navigate("/login"); // Usar navigate para redirecionar
      }, 2000);

    } catch (err: any) {
      setError(err.message || t("register_error_occurred"));
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">{t("register_title")}</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {successMessage && <p className="text-green-500 text-center mb-4">{successMessage}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("form_label_username")}</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="input-field mt-1 block w-full"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("form_label_email")}</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field mt-1 block w-full"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("form_label_password")}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="input-field mt-1 block w-full"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("form_label_confirm_password")}</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="input-field mt-1 block w-full"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary disabled:opacity-50"
          >
            {isLoading ? t("form_button_loading") : t("register_button_text")}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
          {t("register_already_have_account_prompt")} <button onClick={() => navigate("/login")} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 focus:outline-none">{t("register_login_link")}</button>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

