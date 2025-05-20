import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import Board from "./Board.jsx";
import PlayerPanel from "./PlayerPanel.jsx";
import { GameState, Card as GameCard } from "../types/gameTypes";

interface Player {
  id: string;
  username: string;
  score: number;
  isActive: boolean;
}

interface MultiplayerGameState extends GameState {
  roomId: string;
  players: Player[];
  hostId?: string;
  isGameStarted?: boolean;
  currentPlayerId?: string | null;
  roomName?: string;
}

const GameRoomPage = () => {
  const { t } = useTranslation();

  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    const pathParts = window.location.pathname.split("/");
    const idFromPath = pathParts[pathParts.length - 1];
    if (
      idFromPath &&
      idFromPath !== "game-room" &&
      idFromPath !== "lobby" &&
      idFromPath !== "login" &&
      idFromPath !== "register" &&
      idFromPath !== "friends"
    ) {
      setRoomId(idFromPath);
    } else {
      const params = new URLSearchParams(window.location.search);
      const paramRoomId = params.get("roomId");
      if (paramRoomId) {
        setRoomId(paramRoomId);
      } else {
        console.warn("Room ID not found in path or query params.");
      }
    }
  }, []);

  const { socket, isConnected, emitEvent, onEvent, offEvent, connectSocket } =
    useSocket();
  const { user, token } = useAuth();

  const [gameState, setGameState] =
    useState<MultiplayerGameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatusMessage, setConnectionStatusMessage] =
    useState<string>("");

  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  useEffect(() => {
    if (!token) {
      navigateTo("/login");
      return;
    }
    if (!roomId) {
      console.warn("Room ID not yet available for socket connection.");
      return;
    }
    if (!isConnected && token) {
      connectSocket(token);
    }
  }, [token, roomId, isConnected, connectSocket, t]);

  useEffect(() => {
    if (isConnected) {
      setConnectionStatusMessage("");
    } else {
      setConnectionStatusMessage(t("game_room_disconnected_reconnecting"));
    }
  }, [isConnected, t]);

  useEffect(() => {
    if (isConnected && socket && roomId && user) {
      console.log(
        `Socket connected, attempting to join room: ${roomId}, user: ${user.username}`
      );
      setConnectionStatusMessage("");
      setIsLoading(true);

      const handleGameStateUpdate = (newState: MultiplayerGameState) => {
        console.log("Received game state update:", newState);
        setGameState(newState);
        setIsLoading(false);
        setError(null);
      };

      const handleGameError = (errorData: { message: string }) => {
        console.error("Game Error:", errorData.message);
        setError(t(errorData.message, { defaultValue: errorData.message }));
        setIsLoading(false);
      };

      const handlePlayerStatusUpdate = (statusUpdate: {
        playerId: string;
        isActive: boolean;
        username?: string;
        messageKey?: string;
      }) => {
        console.log("Player status update:", statusUpdate);
        setGameState((prev) => {
          if (!prev) return null;
          let playerExists = false;
          const updatedPlayers = prev.players.map((p) => {
            if (p.id === statusUpdate.playerId) {
              playerExists = true;
              return {
                ...p,
                isActive: statusUpdate.isActive,
                username: statusUpdate.username || p.username,
              };
            }
            return p;
          });
          if (!playerExists && statusUpdate.username) {
            updatedPlayers.push({
              id: statusUpdate.playerId,
              username: statusUpdate.username,
              score: 0,
              isActive: statusUpdate.isActive,
            });
          }
          let message = prev.message;
          if (statusUpdate.messageKey) {
            message = t(statusUpdate.messageKey, {
              username: statusUpdate.username || "Player",
            });
          }
          return { ...prev, players: updatedPlayers, message };
        });
      };

      onEvent("gameStateUpdate", handleGameStateUpdate);
      onEvent("gameError", handleGameError);
      onEvent("playerStatusUpdate", handlePlayerStatusUpdate);

      emitEvent("joinRoom", { roomId });

      return () => {
        offEvent("gameStateUpdate", handleGameStateUpdate);
        offEvent("gameError", handleGameError);
        offEvent("playerStatusUpdate", handlePlayerStatusUpdate);
      };
    } else if (!isConnected && roomId && user) {
      setIsLoading(false);
      setError(t("game_room_socket_not_connected"));
    } else if (!roomId && user && token) {
      setIsLoading(false);
      setError(t("game_room_no_id_after_load"));
    }
  }, [isConnected, socket, roomId, user, emitEvent, onEvent, offEvent, t, token]);

  const handleCardClick = (cardId: string) => {
    if (!gameState || gameState.gameOver || !socket || !isConnected) return;
    if (gameState.currentPlayerId !== user?.id) {
      console.log("Not your turn!");
      return;
    }
    const boardIsEffectivelyDisabled =
      !isConnected ||
      gameState.currentPlayerId !== user?.id ||
      gameState.gameOver;
    if (boardIsEffectivelyDisabled) {
      console.log("Board is effectively disabled, not sending card click.");
      return;
    }
    emitEvent("playerAction", { type: "SELECT_CARD", cardId, roomId });
  };

  const handleCallGyul = () => {
    if (!gameState || gameState.gameOver || !socket || !isConnected) return;
    if (gameState.currentPlayerId !== user?.id) {
      console.log("Not your turn to call Gyul!");
      return;
    }
    emitEvent("playerAction", { type: "CALL_GYUL", roomId });
  };

  const handleStartGame = () => {
    if (!socket || !roomId || !isConnected) return;
    if (gameState?.hostId !== user?.id) {
      alert(t("game_room_only_host_can_start"));
      return;
    }
    emitEvent("startGame", { roomId });
  };

  if (isLoading && !error && !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t("game_room_loading_state")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-100 dark:bg-red-900 p-4">
        <p className="text-red-700 dark:text-red-300 text-xl mb-4">
          {t("game_room_error_occurred")}: {error}
        </p>
        <button
          onClick={() => navigateTo("/lobby")}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          {t("game_room_back_to_lobby")}
        </button>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-xl mb-4">
          {roomId
            ? t("game_room_waiting_for_state")
            : t("game_room_no_id_yet")}
        </p>
        {connectionStatusMessage && (
          <p className="text-yellow-500 mb-4">{connectionStatusMessage}</p>
        )}
        <button
          onClick={() => navigateTo("/lobby")}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          {t("game_room_back_to_lobby")}
        </button>
      </div>
    );
  }

  const currentPlayer = gameState.players.find((p) => p.id === user?.id);
  const opponentPlayers = gameState.players.filter((p) => p.id !== user?.id);
  const selectedGameCards = gameState.boardCards.filter((card) =>
    gameState.selectedCards.includes(card.id)
  );
  const boardIsDisabled =
    !isConnected ||
    gameState.currentPlayerId !== user?.id ||
    gameState.gameOver;

  return (
    <div className="container mx-auto p-4 flex flex-col items-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="w-full max-w-4xl mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">
            {t("game_room_title_dynamic", {
              roomName: gameState.roomName || roomId,
            })}
          </h1>
          <button
            onClick={() => navigateTo("/lobby")}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            {t("game_room_leave_room_button")}
          </button>
        </div>
        {connectionStatusMessage && (
          <p className="text-center text-yellow-500 py-2">
            {connectionStatusMessage}
          </p>
        )}
        {!isConnected && (
          <p className="text-center text-red-500 py-2">
            {t("game_room_disconnected_warning")}
          </p>
        )}
      </header>

      {!gameState.isGameStarted &&
        user?.id === gameState.hostId &&
        gameState.players.length >= 1 && (
          <button
            onClick={handleStartGame}
            className="mb-4 bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded text-lg shadow-md"
            disabled={!isConnected}
          >
            {t("game_room_start_game_button")}
          </button>
        )}
      {!gameState.isGameStarted && user?.id !== gameState.hostId && (
        <p className="mb-4 text-lg">
          {t("game_room_waiting_for_host_to_start")}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-4">
        {currentPlayer && (
          <PlayerPanel
            playerName={`${currentPlayer.username} (${t(
              "player_self_name_suffix"
            )})`}
            score={currentPlayer.score}
            isCurrentTurn={gameState.currentPlayerId === currentPlayer.id}
            onGyulClick={handleCallGyul}
            gyulButtonDisabled={
              !isConnected ||
              gameState.currentPlayerId !== currentPlayer.id ||
              gameState.gameOver
            }
            gyulButtonText={t("player_panel_call_gyul")}
            isActive={currentPlayer.isActive}
          />
        )}
        {opponentPlayers.map((opponent) => (
          <PlayerPanel
            key={opponent.id}
            playerName={opponent.username}
            score={opponent.score}
            isCurrentTurn={gameState.currentPlayerId === opponent.id}
            isActive={opponent.isActive}
            onGyulClick={() => {}}
            gyulButtonText=""
            gyulButtonDisabled={true}
          />
        ))}
      </div>

      {gameState.message && (
        <div
          className={`game-message-area text-center p-3 my-3 rounded-md w-full max-w-3xl shadow${
            gameState.message.toLowerCase().includes("incorrect") ||
            gameState.message.toLowerCase().includes("expired") ||
            gameState.message.toLowerCase().includes("error")
              ? "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200"
              : gameState.message.toLowerCase().includes("correct") ||
                gameState.message.toLowerCase().includes("found") ||
                gameState.message.toLowerCase().includes("success")
              ? "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200"
              : "bg-blue-100 dark:bg-gray-700 text-blue-800 dark:text-blue-200"
          }`}
          role="alert"
          aria-live="polite"
        >
          {t(gameState.message, {
            defaultValue: gameState.message,
            username:
              gameState.players.find((p) => p.id === gameState.currentPlayerId)
                ?.username || "",
          })}
        </div>
      )}

      {gameState.isGameStarted &&
      gameState.boardCards &&
      gameState.boardCards.length > 0 ? (
        <div
          className={`${boardIsDisabled ? "opacity-50 pointer-events-none" : ""}`}
        >
          <Board
            cards={gameState.boardCards as GameCard[]}
            onCardClick={handleCardClick}
            selectedCards={selectedGameCards}
          />
        </div>
      ) : (
        <p className="my-4 text-lg">
          {gameState.isGameStarted
            ? t("game_room_loading_board")
            : user?.id === gameState.hostId
            ? t("game_room_press_start_to_begin")
            : t("game_room_waiting_for_game_to_start")}
        </p>
      )}

      {gameState.isGameStarted &&
        !gameState.gameOver &&
        gameState.currentPlayerId === user?.id && (
          <button
            onClick={handleCallGyul}
            disabled={!isConnected || gameState.gameOver || boardIsDisabled}
            className="gyul-button bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded mt-6 text-xl shadow-md disabled:opacity-50"
          >
            GYUL!
          </button>
        )}

      {gameState.gameOver && (
        <div className="mt-8 text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          <h3 className="text-3xl font-semibold mb-3">
            {t("game_over_title")}
          </h3>
          <p className="text-xl mb-6">
            {t(gameState.message, {
              defaultValue: gameState.message,
              winner:
                gameState.players.find(
                  (p) =>
                    p.score === Math.max(...gameState.players.map((pl) => pl.score))
                )?.username || "",
            })}
          </p>
          <button
            onClick={() => navigateTo("/lobby")}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded text-lg"
          >
            {t("game_room_back_to_lobby")}
          </button>
        </div>
      )}

      {gameState.isGameStarted &&
        gameState.timerValue !== undefined &&
        gameState.isTimerRunning && (
          <div className="mt-6 text-2xl font-semibold">
            {t("time_left_label")} {gameState.timerValue}s
          </div>
        )}
    </div>
  );
};

export default GameRoomPage;

