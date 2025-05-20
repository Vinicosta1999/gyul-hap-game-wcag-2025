import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom"; // Importar useNavigate
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

interface Room {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  isPrivate: boolean;
}

const LobbyPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate(); // Hook para navegação
  const { socket, isConnected, emitEvent, onEvent, offEvent, connectSocket } =
    useSocket();
  const { user, token, logout } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [createRoomError, setCreateRoomError] = useState<string | null>(null);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      navigate("/login"); // Usar navigate
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!isConnected && token) {
      connectSocket(token);
    }
  }, [isConnected, token, connectSocket]);

  useEffect(() => {
    if (isConnected && socket) {
      emitEvent("listRooms");

      const handleRoomList = (roomList: Room[]) => {
        console.log("Received room list:", roomList);
        setRooms(roomList);
      };

      const handleNewRoom = (newRoom: Room) => {
        console.log("New room available:", newRoom);
        setRooms((prevRooms) => [...prevRooms, newRoom]);
      };

      const handleRoomUpdate = (updatedRoom: Room) => {
        console.log("Room updated:", updatedRoom);
        setRooms((prevRooms) =>
          prevRooms.map((room) =>
            room.id === updatedRoom.id ? updatedRoom : room
          )
        );
      };

      const handleRoomRemoved = (roomId: string) => {
        console.log("Room removed:", roomId);
        setRooms((prevRooms) => prevRooms.filter((room) => room.id !== roomId));
      };

      const handleJoinRoomSuccess = (data: { roomId: string }) => {
        console.log(`Successfully joined room ${data.roomId}`);
        navigate(`/room/${data.roomId}`); // Usar navigate
      };

      const handleJoinRoomError = (error: { message: string }) => {
        console.error("Failed to join room:", error.message);
        alert(t("lobby_join_room_error", { error: error.message }));
        setJoiningRoomId(null);
      };

      onEvent("roomList", handleRoomList);
      onEvent("newRoomAvailable", handleNewRoom);
      onEvent("roomUpdate", handleRoomUpdate);
      onEvent("roomRemoved", handleRoomRemoved);
      onEvent("joinRoomSuccess", handleJoinRoomSuccess);
      onEvent("joinRoomError", handleJoinRoomError);

      return () => {
        offEvent("roomList", handleRoomList);
        offEvent("newRoomAvailable", handleNewRoom);
        offEvent("roomUpdate", handleRoomUpdate);
        offEvent("roomRemoved", handleRoomRemoved);
        offEvent("joinRoomSuccess", handleJoinRoomSuccess);
        offEvent("joinRoomError", handleJoinRoomError);
      };
    }
  }, [isConnected, socket, emitEvent, onEvent, offEvent, t, navigate]);

  const handleCreateRoom = async (event: FormEvent) => {
    event.preventDefault();
    if (!newRoomName.trim() || !socket || !isConnected) return;
    setIsCreatingRoom(true);
    setCreateRoomError(null);

    const roomSettings = {
      name: newRoomName,
      isPrivate: false,
      password: "", // Senha vazia para salas públicas
      gameConfig: {
        timerDuration: 30,
        maxRounds: 5,
        cardSet: "default",
      },
    };

    const handleRoomCreated = (room: Room) => {
      console.log("Room created successfully:", room);
      setNewRoomName("");
      setIsCreatingRoom(false);
      // Não precisa remover listeners aqui se eles são genéricos para o lobby
    };
    const handleCreateRoomError = (error: { message: string }) => {
      console.error("Error creating room:", error.message);
      setCreateRoomError(error.message || t("lobby_create_room_default_error"));
      setIsCreatingRoom(false);
    };
    
    // Registrar listeners uma vez, se possível, ou garantir limpeza adequada
    // Se estes são específicos para esta ação, a limpeza é importante
    onEvent("roomCreated", handleRoomCreated); // Este listener pode ser mais genérico e não precisar ser removido aqui
    onEvent("createRoomError", handleCreateRoomError); // Idem

    emitEvent("createRoom", roomSettings);
  };

  const handleJoinRoom = (roomId: string, isPrivate: boolean) => {
    if (!socket || !isConnected) return;
    setJoiningRoomId(roomId);

    if (isPrivate) {
      const password = prompt(t("lobby_enter_password_prompt"));
      if (password === null) { // Usuário cancelou o prompt
        setJoiningRoomId(null);
        return;
      }
      emitEvent("joinRoom", { roomId, password });
    } else {
      emitEvent("joinRoom", { roomId });
    }
  };

  const handleLogout = () => {
    logout();
    if (socket) socket.disconnect();
    navigate("/login"); // Usar navigate
  };

  if (!token || !user) {
    // O ProtectedRoute em App.tsx já deve cuidar disso, mas como fallback:
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t("loading_auth_status")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 text-gray-900 dark:text-gray-100">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t("lobby_title")}</h1>
        <div className="flex items-center">
          <span className="mr-4">
            {t("lobby_welcome_user", { username: user.username })}
          </span>
          <button
            onClick={() => navigate("/friends")}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded mr-2"
          >
            {t("friends_page_title")}
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            {t("logout_button_text")}
          </button>
        </div>
      </header>

      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-3">
          {t("lobby_create_room_title")}
        </h2>
        <form onSubmit={handleCreateRoom} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder={t("lobby_room_name_placeholder")}
            required
            className="flex-grow p-2 border border-input bg-transparent rounded-md input-field"
          />
          <button
            type="submit"
            disabled={isCreatingRoom || !isConnected || !newRoomName.trim()}
            className="btn btn-primary disabled:opacity-50"
          >
            {isCreatingRoom
              ? t("form_button_loading")
              : t("lobby_create_button_text")}
          </button>
        </form>
        {createRoomError && (
          <p className="text-red-500 mt-2">{createRoomError}</p>
        )}
        {!isConnected && (
          <p className="text-yellow-500 mt-2">
            {t("lobby_socket_disconnected_warning")}
          </p>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">
          {t("lobby_available_rooms_title")}
        </h2>
        {rooms.length === 0 ? (
          <p>{t("lobby_no_rooms_available")}</p>
        ) : (
          <ul className="space-y-3">
            {rooms.map((room) => (
              <li
                key={room.id}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex justify-between items-center"
              >
                <div>
                  <h3 className="text-lg font-medium">{room.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("lobby_players_count", {
                      playerCount: room.playerCount,
                      maxPlayers: room.maxPlayers || 2, // Default para 2 se não especificado
                    })}
                    {room.isPrivate
                      ? ` (${t("lobby_private_room_indicator")})`
                      : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleJoinRoom(room.id, room.isPrivate)}
                  disabled={
                    joiningRoomId === room.id ||
                    !isConnected ||
                    room.playerCount >= (room.maxPlayers || 2) // Default para 2 se não especificado
                  }
                  className="btn btn-secondary disabled:opacity-50"
                >
                  {joiningRoomId === room.id
                    ? t("form_button_loading")
                    : t("lobby_join_button_text")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LobbyPage;

