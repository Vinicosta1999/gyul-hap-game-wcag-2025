```javascript
// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AuthService from '../services/AuthService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
  const [loading, setLoading] = useState(true); // Para estado inicial de carregamento

  useEffect(() => {
    // Poderia adicionar um listener para storage events se o token for modificado em outra aba
    // Ou verificar a validade do token com o backend aqui
    const user = AuthService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const userData = await AuthService.login(email, password);
      setCurrentUser(userData.user); // Backend retorna o usuário em userData.user
      return userData;
    } catch (error) {
      setCurrentUser(null);
      throw error;
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await AuthService.register(username, email, password);
      // Normalmente, após o registro, o usuário pode precisar fazer login
      // ou o backend pode logá-lo automaticamente e retornar um token.
      // Por enquanto, apenas retornamos a resposta.
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    AuthService.logout();
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    isAuthenticated: !!currentUser, // Simplificação: se currentUser existe, está autenticado
  };

  // Não renderizar children até que o estado inicial de autenticação seja determinado
  if (loading) {
    return null; // Ou um spinner de carregamento global
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
```
