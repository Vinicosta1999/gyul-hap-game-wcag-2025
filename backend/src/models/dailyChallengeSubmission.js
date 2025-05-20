const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DailyChallengeSubmission extends Model {
    static associate(models) {
      // Define association here if needed, e.g., belongsTo User and DailyChallenge
      DailyChallengeSubmission.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
      DailyChallengeSubmission.belongsTo(models.DailyChallenge, {
        foreignKey: "dailyChallengeId",
        as: "dailyChallenge",
      });
    }
  }
  DailyChallengeSubmission.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    dailyChallengeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "DailyChallenges",
        key: "id",
      },
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    submitted_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    modelName: "DailyChallengeSubmission",
    timestamps: true, // Automatically add createdAt and updatedAt
    updatedAt: "updated_at",
    createdAt: "created_at",
  });
  return DailyChallengeSubmission;
};

