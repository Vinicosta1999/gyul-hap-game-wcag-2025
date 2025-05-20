// LoginForm.jsx (com validação avançada de entrada)
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/AuthService';
import { AuthContext } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

// Simulação de biblioteca de validação (ex: Yup ou Zod)
const validateLoginForm = (values) => {
  const errors = {};
  if (!values.email) {
    errors.email = 'error_email_required'; // Chave para i18n
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
    errors.email = 'error_email_invalid';
  }
  if (!values.password) {
    errors.password = 'error_password_required';
  }
  return errors;
};

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { login: contextLogin } = useContext(AuthContext);
  const { t } = useTranslation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrors({});

    const formValues = { email, password };
    const validationErrors = validateLoginForm(formValues);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const data = await AuthService.login(email, password);
      contextLogin(data.user); // Atualiza o contexto com o usuário
      navigate('/profile'); // Ou para a página principal do jogo/dashboard
    } catch (error) {
      const resMessage = error.message || error.toString();
      setMessage(t('error_login_failed') + (resMessage.includes('NetworkError') ? t('error_network') : resMessage)); // Adiciona tradução e trata erros de rede
      // Idealmente, o backend retornaria códigos de erro específicos para tradução mais granular
      if (resMessage.includes("Invalid credentials") || resMessage.includes("User not found")) {
        setErrors({ general: 'error_invalid_credentials' });
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
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">{t('email')}</label>
            <input
              type="text"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
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
            <label htmlFor="password">{t('password')}</label>
            <input
              type="password"
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="passwordError"
            />
            {errors.password && (
              <div id="passwordError" className="invalid-feedback">{t(errors.password)}</div>
            )}
          </div>
          {errors.general && (
            <div className="form-group">
                <div className="alert alert-danger" role="alert">
                    {t(errors.general)}
                </div>
            </div>
          )}
          <div className="form-group">
            <button className="btn btn-primary btn-block" disabled={loading}>
              {loading && (
                <span className="spinner-border spinner-border-sm"></span>
              )}
              <span>{t('login')}</span>
            </button>
          </div>
          {message && (
            <div className="form-group">
              <div className="alert alert-danger" role="alert">
                {message}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginForm;

