
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DailyChallenge extends Model {
    static associate(models) {
      DailyChallenge.hasMany(models.DailyChallengeSubmission, {
        foreignKey: 'dailyChallengeId',
        as: 'submissions',
      });
    }
  }
  DailyChallenge.init({
    challenge_date: {
      type: DataTypes.DATEONLY, // Use DATEONLY to store just the date part
      allowNull: false,
      unique: true,
    },
    seed: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // Optional: store the actual card set if pre-generated
    // card_set: {
    //   type: DataTypes.JSONB,
    //   allowNull: true,
    // }
  }, {
    sequelize,
    modelName: 'DailyChallenge',
    timestamps: true, // Enables createdAt and updatedAt
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  });
  return DailyChallenge;
};
