const jwt = require("jsonwebtoken");
const { User } = require("../models"); 
const { gameReducer, ACTIONS, INITIAL_STATE } = require("../lib/gameLogic");
const { shuffleDeck, ALL_CARDS, updateCardSet, CARD_SETS } = require("../lib/cardUtils");

require("dotenv").config({ path: require("path").resolve(__dirname, "../../../.env") });

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

let activeRooms = {}; 
// Room structure: 
// roomId: {
//   id: string,
//   name: string,
//   players: Array<{id: number, username: string, socketId: string, score: number}>,
//   creatorId: number,
//   isPrivate: boolean,
//   password?: string | null,
//   gameState: object | null, // Stores the result of gameReducer
//   maxPlayers: number,
//   gameSettings: { timerConfig: number, maxRoundsConfig: number, cardSetKey: string }
//   gameTimerInterval: NodeJS.Timeout | null
// }

const initializeSocketIO = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = await User.findByPk(decoded.id, { attributes: ["id", "username"] });
        if (!socket.user) {
          return next(new Error("Authentication error: User not found."));
        }
        next();
      } catch (err) {
        console.error("Socket Auth Error:", err.message);
        return next(new Error("Authentication error: Invalid token."));
      }
    } else {
      console.log(`Socket ${socket.id} connected without token.`);
      // For game actions, we will check socket.user explicitly.
      next(); 
    }
  });

  io.on("connection", (socket) => {
    console.log(`User ${socket.user ? socket.user.username : socket.id} connected.`);

    socket.on("createRoom", async (data, callback) => {
      if (!socket.user) return callback({ error: "Authentication required to create a room." });
      try {
        const roomName = data.name || `${socket.user.username}\'s Game`;
        const isPrivate = data.isPrivate || false;
        const password = data.password || null;
        const timerConfig = data.timerConfig !== undefined ? data.timerConfig : INITIAL_STATE.timerConfig;
        const maxRoundsConfig = data.maxRoundsConfig !== undefined ? data.maxRoundsConfig : INITIAL_STATE.maxRoundsConfig;
        const cardSetKey = data.cardSetKey || "default";

        const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        activeRooms[roomId] = {
          id: roomId,
          name: roomName,
          players: [{ id: socket.user.id, username: socket.user.username, socketId: socket.id, score: 0 }],
          creatorId: socket.user.id,
          isPrivate: isPrivate,
          password: isPrivate ? password : null,
          gameState: null, 
          maxPlayers: 2,
          gameSettings: { timerConfig, maxRoundsConfig, cardSetKey },
          gameTimerInterval: null,
        };

        socket.join(roomId);
        console.log(`User ${socket.user.username} created and joined room ${roomId}: ${roomName}`);
        io.to(roomId).emit("roomUpdate", activeRooms[roomId]);
        if (!isPrivate) {
            io.emit("newRoomAvailable", { id: roomId, name: roomName, playerCount: 1, maxPlayers: 2 });
        }
        callback({ success: true, room: activeRooms[roomId] });
      } catch (error) {
        console.error("Create room error:", error);
        callback({ error: "Failed to create room." });
      }
    });

    socket.on("listRooms", (callback) => {
        const publicRooms = Object.values(activeRooms)
            .filter(room => !room.isPrivate && (!room.gameState || !room.gameState.gameOver) && room.players.length < room.maxPlayers)
            .map(room => ({ id: room.id, name: room.name, playerCount: room.players.length, maxPlayers: room.maxPlayers }));
        callback(publicRooms);
    });

    socket.on("joinRoom", (data, callback) => {
      if (!socket.user) return callback({ error: "Authentication required to join a room." });
      const { roomId, password } = data;
      const room = activeRooms[roomId];

      if (!room) return callback({ error: "Room not found." });
      if (room.players.length >= room.maxPlayers) return callback({ error: "Room is full." });
      if (room.players.find(p => p.id === socket.user.id)) {
        socket.join(roomId); 
        return callback({ success: true, room, message: "Rejoined room." });
      }
      if (room.isPrivate && room.password !== password) return callback({ error: "Invalid password for private room." });

      room.players.push({ id: socket.user.id, username: socket.user.username, socketId: socket.id, score: 0 });
      socket.join(roomId);
      console.log(`User ${socket.user.username} joined room ${roomId}`);
      io.to(roomId).emit("roomUpdate", room);
      if (!room.isPrivate) {
        io.emit("roomStatusUpdate", { id: roomId, name: room.name, playerCount: room.players.length, maxPlayers: room.maxPlayers, isFull: room.players.length >= room.maxPlayers });
      }
      callback({ success: true, room });

      // Auto-start game if room is full (e.g., 2 players)
      if (room.players.length === room.maxPlayers && !room.gameState) {
        startGameInRoom(roomId, io);
      }
    });

    socket.on("leaveRoom", (roomId, callback) => {
      handleLeaveRoom(socket, roomId, io, callback);
    });

    socket.on("startGame", (roomId, callback) => {
        if (!socket.user) return callback({ error: "Authentication required." });
        const room = activeRooms[roomId];
        if (!room) return callback({ error: "Room not found." });
        if (room.creatorId !== socket.user.id) return callback({ error: "Only the room creator can start the game." });
        if (room.players.length < 2) return callback({ error: "Not enough players to start." }); // Or 1 for solo, adjust as needed
        if (room.gameState && !room.gameState.gameOver) return callback({ error: "Game already in progress." });

        startGameInRoom(roomId, io);
        callback({ success: true });
    });

    socket.on("playerAction", (data, callback) => {
        if (!socket.user) return callback({ error: "Authentication required." });
        const { roomId, action } = data;
        const room = activeRooms[roomId];

        if (!room || !room.gameState || room.gameState.gameOver) {
            return callback({ error: "Game not active or room not found." });
        }
        // Validate if it's the player's turn
        if (room.gameState.gameMode === "multiplayer_classic" && room.gameState.currentPlayerId !== socket.user.id) {
            return callback({ error: "Not your turn." });
        }

        // Add playerId to action payload for reducer
        const actionWithPlayer = { ...action, payload: { ...action.payload, playerId: socket.user.id } };
        
        room.gameState = gameReducer(room.gameState, actionWithPlayer);

        // If timer was running and action is SELECT_CARD (3 selected) or CALL_GYUL, clear old timer
        if (room.gameTimerInterval && (action.type === ACTIONS.SELECT_CARD && room.gameState.selectedCards.length === 0 || action.type === ACTIONS.CALL_GYUL)) {
            clearInterval(room.gameTimerInterval);
            room.gameTimerInterval = null;
        }

        // If game is not over and timer should be running, start/reset it
        if (!room.gameState.gameOver && room.gameState.isTimerRunning && room.gameSettings.timerConfig > 0 && !room.gameTimerInterval) {
            room.gameTimerInterval = startGameTimer(roomId, io);
        }

        io.to(roomId).emit("gameStateUpdate", room.gameState);
        callback({ success: true, newState: room.gameState });

        if (room.gameState.gameOver) {
            console.log(`Game over in room ${roomId}. Winner: ${room.gameState.message}`);
            if (room.gameTimerInterval) {
                clearInterval(room.gameTimerInterval);
                room.gameTimerInterval = null;
            }
            // Optionally, update player stats in DB here
        }
    });

    socket.on("disconnecting", () => {
        for (const roomId of socket.rooms) {
            if (roomId !== socket.id) {
                handleLeaveRoom(socket, roomId, io, null, true); // isDisconnecting = true
            }
        }
    });

    socket.on("disconnect", () => {
      console.log(`User ${socket.user ? socket.user.username : socket.id} disconnected.`);
    });
  });
};

function startGameInRoom(roomId, io) {
    const room = activeRooms[roomId];
    if (!room) return;

    const initialGamePlayers = room.players.map(p => ({ id: p.id, username: p.username, score: 0 }));

    room.gameState = gameReducer(
        { ...INITIAL_STATE, gameMode: "multiplayer_classic", ...room.gameSettings }, 
        { type: ACTIONS.START_GAME, payload: { players: initialGamePlayers, cardSetKey: room.gameSettings.cardSetKey, seed: Date.now() } }
    );

    console.log(`Game started in room ${roomId}`);
    io.to(roomId).emit("gameStarted", room.gameState);
    io.to(roomId).emit("gameStateUpdate", room.gameState); // Send initial state

    // Start game timer if applicable
    if (room.gameState.isTimerRunning && room.gameSettings.timerConfig > 0) {
        if (room.gameTimerInterval) clearInterval(room.gameTimerInterval);
        room.gameTimerInterval = startGameTimer(roomId, io);
    }
}

function startGameTimer(roomId, io) {
    const room = activeRooms[roomId];
    if (!room || !room.gameState || !room.gameSettings) return null;

    return setInterval(() => {
        const currentRoom = activeRooms[roomId]; // Get fresh room state
        if (!currentRoom || !currentRoom.gameState || currentRoom.gameState.gameOver || !currentRoom.gameState.isTimerRunning) {
            if (currentRoom && currentRoom.gameTimerInterval) clearInterval(currentRoom.gameTimerInterval);
            if (currentRoom) currentRoom.gameTimerInterval = null;
            return;
        }

        currentRoom.gameState = gameReducer(currentRoom.gameState, { type: ACTIONS.DECREMENT_TIMER });
        io.to(roomId).emit("gameStateUpdate", currentRoom.gameState);

        if (currentRoom.gameState.timerValue <= 0 && currentRoom.gameState.isTimerRunning) { // Timer reached 0
            clearInterval(currentRoom.gameTimerInterval);
            currentRoom.gameTimerInterval = null;
            currentRoom.gameState = gameReducer(currentRoom.gameState, { type: ACTIONS.TIMER_EXPIRED });
            io.to(roomId).emit("gameStateUpdate", currentRoom.gameState);
            console.log(`Timer expired for player ${currentRoom.gameState.currentPlayerId} in room ${roomId}`);
            
            // If game not over, restart timer for next player
            if (!currentRoom.gameState.gameOver && currentRoom.gameState.isTimerRunning && currentRoom.gameSettings.timerConfig > 0) {
                currentRoom.gameTimerInterval = startGameTimer(roomId, io);
            }
        }
    }, 1000);
}

function handleLeaveRoom(socket, roomId, io, callback, isDisconnecting = false) {
    if (!socket.user && !isDisconnecting) return callback ? callback({ error: "Authentication required." }) : null;
    const room = activeRooms[roomId];
    const userId = socket.user ? socket.user.id : null;
    const socketId = socket.id;

    if (room) {
        const playerIndex = room.players.findIndex(p => p.socketId === socketId || (userId && p.id === userId));
        if (playerIndex === -1 && !isDisconnecting) {
             if (callback) callback({ error: "User not in room." });
             return;
        }

        if (playerIndex !== -1) {
            const leavingPlayer = room.players[playerIndex];
            console.log(`User ${leavingPlayer.username} (socket ${socketId}) is leaving/disconnecting from room ${roomId}`);
            room.players.splice(playerIndex, 1);
        } else if (isDisconnecting) {
             console.log(`Socket ${socketId} (user unknown or already removed by ID) disconnected from room ${roomId}`);
        }

        socket.leave(roomId);

        if (room.players.length === 0) {
            console.log(`Room ${roomId} is empty, deleting.`);
            if (room.gameTimerInterval) clearInterval(room.gameTimerInterval);
            if (!room.isPrivate) io.emit("roomRemoved", roomId);
            delete activeRooms[roomId];
        } else {
            // If game was in progress, handle player leaving (e.g., forfeit, or game ends)
            if (room.gameState && !room.gameState.gameOver) {
                // Simple: end game if a player leaves mid-game
                room.gameState.gameOver = true;
                room.gameState.message = `message_player_left_game_over`;
                if (room.gameTimerInterval) {
                    clearInterval(room.gameTimerInterval);
                    room.gameTimerInterval = null;
                }
                console.log(`Game in room ${roomId} ended because a player left.`);
            }
            // If creator leaves, assign new creator (e.g., first player in list)
            if (userId && room.creatorId === userId && room.players.length > 0) {
                room.creatorId = room.players[0].id;
                console.log(`New creator for room ${roomId}: ${room.players[0].username}`);
            }
            io.to(roomId).emit("roomUpdate", room);
            if (room.gameState && room.gameState.gameOver) io.to(roomId).emit("gameStateUpdate", room.gameState);
            if (!room.isPrivate) io.emit("roomStatusUpdate", { id: roomId, name: room.name, playerCount: room.players.length, maxPlayers: room.maxPlayers, isFull: false });
        }
        if (callback) callback({ success: true });
    } else {
        if (callback && !isDisconnecting) callback({ error: "Room not found." });
    }
}

module.exports = { initializeSocketIO, activeRooms };
