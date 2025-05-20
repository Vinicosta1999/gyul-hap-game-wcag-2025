
// Correção: Este arquivo deve ser /home/ubuntu/gyul_hap_full_stack_wcag_project/backend/src/models/gameRoom.js
// O conteúdo abaixo é para o modelo GameRoom, conforme o plano de arquitetura.

'use strict';
const { Model, UUIDV4 } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GameRoom extends Model {
    static associate(models) {
      GameRoom.belongsTo(models.User, {
        foreignKey: 'player1_id',
        as: 'player1',
      });
      GameRoom.belongsTo(models.User, {
        foreignKey: 'player2_id',
        as: 'player2',
      });
    }
  }
  GameRoom.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    room_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    player1_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Can be null if player 1 leaves or room is waiting
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    player2_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Can be null if player 2 hasn't joined or leaves
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    current_game_state: {
      type: DataTypes.JSONB,
      allowNull: true, // Stores the state of the board, scores, current turn, etc.
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'waiting', // e.g., "waiting", "in_progress", "finished", "aborted"
    },
  }, {
    sequelize,
    modelName: 'GameRoom',
    tableName: 'GameRooms', // Explicitly define table name
    timestamps: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  });
  return GameRoom;
};
