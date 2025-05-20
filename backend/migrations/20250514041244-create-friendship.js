
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Friendships', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId1: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users', // Name of the Users table
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId2: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'blocked'),
        allowNull: false,
        defaultValue: 'pending'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add a unique constraint to prevent duplicate friendships (e.g., user1-user2 and user2-user1)
    // This might need to be handled at the application level or with a more complex constraint
    // depending on how you want to define uniqueness (e.g., (userId1, userId2) should be unique regardless of order)
    // For simplicity, a basic unique constraint on the pair as ordered:
    await queryInterface.addConstraint('Friendships', {
      fields: ['userId1', 'userId2'],
      type: 'unique',
      name: 'unique_friendship_pair'
    });

  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Friendships');
  }
};
