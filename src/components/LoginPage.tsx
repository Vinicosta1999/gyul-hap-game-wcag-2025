import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom"; // Importar useNavigate
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket"; 
import { useTranslation } from "react-i18next";

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate(); // Hook para navegação
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { connectSocket } = useSocket(); 

  // Corrigir para usar import.meta.env para variáveis de ambiente em Vite
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("login_failed_default_error"));
      }

      login(data.token, data.user);
      
      connectSocket(data.token);

      navigate("/lobby"); // Usar navigate para redirecionar

    } catch (err: any) {
      setError(err.message || t("login_error_occurred"));
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">{t("login_title")}</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
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
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("form_label_password")}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field mt-1 block w-full"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary disabled:opacity-50"
          >
            {isLoading ? t("form_button_loading") : t("login_button_text")}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
          {t("login_no_account_prompt")} <button onClick={() => navigate("/register")} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 focus:outline-none">{t("login_register_link")}</button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

