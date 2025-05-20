
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Score extends Model {
    static associate(models) {
      Score.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });
      // Corrected: Assuming a Score can be associated with one DailyChallengeSubmission
      // If a DailyChallengeSubmission belongs to a Score, the association might be on the DailyChallengeSubmission model instead
      // Or if a Score can have many submissions (less likely for a single score entry), it would be hasMany.
      // For now, assuming a Score might be linked to a specific submission if it's a daily challenge score.
      Score.hasOne(models.DailyChallengeSubmission, { // Or belongsTo if DailyChallengeSubmission has scoreId
        foreignKey: 'scoreId', // This implies DailyChallengeSubmission has a scoreId column
        as: 'dailyChallengeSubmission',
      });
    }
  }
  Score.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users', // Name of the table
        key: 'id',
      },
    },
    game_mode: {
      type: DataTypes.STRING,
      allowNull: false, // e.g., "solo_time_attack", "daily_challenge", "classic_multiplayer"
    },
    score_value: { // Renamed 'score' to 'score_value' to avoid conflict with Sequelize's internal 'score' if any, and for clarity
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    game_duration_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    details: {
      type: DataTypes.JSONB, // For storing game-specific details, like seed for daily challenge
      allowNull: true,
    },
    played_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    modelName: 'Score',
    timestamps: true, // Enables createdAt and updatedAt
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  });
  return Score;
};

