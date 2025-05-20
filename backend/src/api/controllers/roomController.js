const { GameRoom, User } = require("../../models");
const { v4: uuidv4 } = require("uuid");
const { getInitialGameState } = require("../../services/gameService"); // Precisará ser criado

// POST /api/rooms/create - Cria uma nova sala de jogo
exports.createRoom = async (req, res) => {
  const { userId, settings, roomName } = req.body; // userId do criador, settings (timer, rounds), roomName (opcional)

  if (!userId) {
    return res.status(400).send({ message: "UserId is required to create a room." });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    const initialGameState = getInitialGameState(settings); // Passa as configurações para o estado inicial

    const newRoom = await GameRoom.create({
      id: uuidv4(), // Garante que o ID seja gerado aqui se o default do modelo não funcionar como esperado
      player1Id: userId,
      // player1SocketId: null, // Será definido quando o jogador se conectar via WebSocket
      gameModeSettings: settings || { timerPerMove: 30, maxRounds: 10 }, // Default settings
      gameState: initialGameState,
      status: "waiting",
      roomName: roomName || `Sala de ${user.username}` // Nomeia a sala ou usa um padrão
    });

    return res.status(201).send({
      message: "Room created successfully.",
      roomId: newRoom.id,
      roomName: newRoom.roomName,
      // gameState: newRoom.gameState // Opcional: enviar estado inicial já aqui
    });

  } catch (error) {
    console.error("Error creating room: ", error);
    return res.status(500).send({ message: "Error creating room.", error: error.message });
  }
};

// GET /api/rooms/list - Lista salas disponíveis (status "waiting")
exports.listRooms = async (req, res) => {
  try {
    const rooms = await GameRoom.findAll({
      where: { status: "waiting" },
      attributes: ["id", "roomName", "player1Id", "status", "createdAt"],
      include: [{
        model: User,
        as: "player1",
        attributes: ["id", "username"]
      }],
      order: [["createdAt", "DESC"]]
    });
    return res.status(200).send(rooms);
  } catch (error) {
    console.error("Error listing rooms: ", error);
    return res.status(500).send({ message: "Error listing rooms.", error: error.message });
  }
};

// Juntar-se a uma sala via API (pode ser mais apropriado via WebSocket diretamente)
// Esta função é um placeholder e pode ser removida ou adaptada para lógica de WebSocket.
/* exports.joinRoomViaApi = async (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).send({ message: "UserId is required to join a room." });
  }

  try {
    const room = await GameRoom.findByPk(roomId);
    if (!room) {
      return res.status(404).send({ message: "Room not found." });
    }
    if (room.status !== "waiting") {
      return res.status(403).send({ message: "Room is not available for joining (already in progress or finished)." });
    }
    if (room.player1Id === userId) {
        return res.status(400).send({ message: "You are already in this room as Player 1." });
    }
    if (room.player2Id) {
        return res.status(403).send({ message: "Room is already full." });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    room.player2Id = userId;
    room.status = "in_progress"; // Ou aguardar confirmação via WebSocket
    // Idealmente, o gameState também seria atualizado aqui ou via WebSocket
    await room.save();

    // Notificar via WebSocket que o jogador entrou e o jogo pode começar
    // req.io.to(roomId).emit("player_joined", { userId, username: user.username, gameState: room.gameState });
    // req.io.to(roomId).emit("game_started", { gameState: room.gameState });

    return res.status(200).send({ message: "Joined room successfully. Game starting.", roomId: room.id, gameState: room.gameState });

  } catch (error) {
    console.error("Error joining room via API: ", error);
    return res.status(500).send({ message: "Error joining room.", error: error.message });
  }
}; */

