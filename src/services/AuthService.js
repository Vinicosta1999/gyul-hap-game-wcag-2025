// src/services/AuthService.js (Atualizado com funções para 2FA)
// Esta versão assume que o backend agora lida com o armazenamento e envio de tokens via cookies HttpOnly e Secure.
// E adiciona chamadas para os endpoints de 2FA.

const API_URL = "https://yljxvcan.manus.space/api/"; // Ajustado para o proxy do Vite ou configuração similar

const storeCurrentUser = (user) => {
  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
  } else {
    localStorage.removeItem("currentUser");
  }
};

const register = async (username, email, password) => {
  const response = await fetch(API_URL + "auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw data; // Lança o objeto de erro do backend para tratamento granular
  }
  if (data.user) {
    storeCurrentUser(data.user);
  }
  return data;
};

const login = async (email, password) => {
  const response = await fetch(API_URL + "auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    credentials: "include"
  });
  const data = await response.json();
  if (!response.ok) {
    storeCurrentUser(null);
    throw data; // Lança o objeto de erro do backend
  }
  // Se o backend indicar que 2FA é necessário (ex: data.twoFactorRequired = true)
  // o frontend deve lidar com isso antes de chamar storeCurrentUser.
  // Por enquanto, assumimos que se o login primário for ok, e 2FA não for explicitamente requerido na resposta,
  // o usuário é logado ou os dados do usuário são retornados para a próxima etapa (2FA).
  if (data.user && !data.twoFactorRequired) { // Se 2FA não for requerido e usuário existir, armazena
    storeCurrentUser(data.user);
  }
  return data; // Retorna os dados (pode incluir user, twoFactorRequired, userId para etapa 2FA)
};

const logout = async () => {
  try {
    await fetch(API_URL + "auth/logout", {
      method: "POST",
      credentials: "include"
    });
  } catch (error) {
    console.error("Error during server-side logout:", error);
  }
  storeCurrentUser(null);
  return Promise.resolve();
};

const refreshToken = async () => { // Esta função pode precisar ser reavaliada com 2FA
  try {
    const response = await fetch(API_URL + "auth/refresh-token", {
      method: "POST",
      credentials: "include"
    });
    const data = await response.json();
    if (!response.ok) {
      await logout();
      throw data;
    }
    if (data.user) {
        storeCurrentUser(data.user);
    }
    return true;
  } catch (error) {
    console.error("Error refreshing session:", error);
    await logout();
    throw error;
  }
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem("currentUser");
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error("Could not parse user from localStorage", e);
      storeCurrentUser(null);
      return null;
    }
  }
  return null;
};

const checkSession = async () => {
  try {
    const response = await fetch(API_URL + "auth/session-status", {
        method: "GET",
        credentials: "include"
    });
    if (!response.ok) {
        if (response.status === 401) {
            await logout();
            return null;
        }
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw errorData;
    }
    const data = await response.json();
    if (data.user) {
        storeCurrentUser(data.user);
        return data.user;
    }
    await logout();
    return null;
  } catch (error) {
    console.error("Session check failed:", error);
    await logout();
    return null;
  }
};

// --- Funções 2FA --- 

const setup2FA = async () => {
  const response = await fetch(API_URL + "auth/2fa/setup", {
    method: "POST",
    credentials: "include", // Envia cookies de sessão para autorizar esta operação
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw data;
  }
  return data; // Espera-se { secret, otpAuthUrl, message }
};

const verify2FASetup = async (totpToken) => {
  const response = await fetch(API_URL + "auth/2fa/verify-setup", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ totpToken }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw data;
  }
  return data; // Espera-se { message, recoveryCodes }
};

// Chamado após login com senha bem-sucedido, se 2FA for necessário.
// userId é obtido da resposta do login inicial.
const loginWith2FA = async (userId, code, isRecovery = false) => {
  const payload = { userId };
  if (isRecovery) {
    payload.recoveryCode = code;
  } else {
    payload.totpToken = code;
  }
  const response = await fetch(API_URL + "auth/2fa/authenticate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    credentials: "include" // Para que o backend possa setar os cookies de sessão finais
  });
  const data = await response.json();
  if (!response.ok) {
    storeCurrentUser(null); // Garante limpeza em caso de falha na etapa 2FA
    throw data;
  }
  // Se 2FA bem-sucedido, o backend deve ter setado os cookies de sessão.
  // Armazena os dados do usuário retornados.
  if (data.user) {
    storeCurrentUser(data.user);
  }
  return data; // Espera-se { message, user }
};

const disable2FA = async (/* payload opcional como currentPassword ou totpToken para confirmação */) => {
  const response = await fetch(API_URL + "auth/2fa/disable", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    // body: JSON.stringify(payload), // Se o backend exigir confirmação
  });
  const data = await response.json();
  if (!response.ok) {
    throw data;
  }
  // Atualizar o estado do usuário no frontend (isTwoFactorEnabled = false)
  const currentUser = getCurrentUser();
  if(currentUser) {
    storeCurrentUser({...currentUser, isTwoFactorEnabled: false});
  }
  return data; // Espera-se { message }
};


const AuthService = {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken,
  checkSession,
  setup2FA,
  verify2FASetup,
  loginWith2FA,
  disable2FA,
};

export default AuthService;

