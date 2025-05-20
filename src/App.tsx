import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Game from "./components/Game";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import LobbyPage from "./components/LobbyPage";
import GameRoomPage from "./components/GameRoomPage";
import FriendsPage from "./components/FriendsPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./index.css"; // Ensure global styles are imported

// Componente para rotas protegidas
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Carregando...</div>; // Ou um spinner/loading component
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Rotas Protegidas */}
      <Route 
        path="/lobby" 
        element={<ProtectedRoute><LobbyPage /></ProtectedRoute>} 
      />
      <Route 
        path="/room/:roomId" 
        element={<ProtectedRoute><GameRoomPage /></ProtectedRoute>} 
      />
      <Route 
        path="/friends" 
        element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} 
      />
      <Route 
        path="/game" // Rota para o jogo single-player ou modo offline
        element={<ProtectedRoute><Game /></ProtectedRoute>} 
      />

      {/* Rota padrão: redireciona para login ou lobby dependendo da autenticação */}
      <Route 
        path="*" 
        element={
          <AuthRedirect />
        } 
      />
    </Routes>
  );
}

// Componente para redirecionamento inicial baseado na autenticação
const AuthRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div>Carregando...</div>;
  }
  return isAuthenticated ? <Navigate to="/lobby" replace /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App min-h-screen bg-[hsl(var(--gh-bg-main))] text-[hsl(var(--gh-text-primary))]">
          <AppContent />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

