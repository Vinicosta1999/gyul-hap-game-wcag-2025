const { Friendship, User } = require("../../models");
const { Op } = require("sequelize");

// Search for users by username
exports.searchUsers = async (req, res) => {
  const { username } = req.query;
  const currentUserId = req.user.id;

  if (!username || username.trim() === "") {
    return res.status(400).json({ message: "Username query parameter is required." });
  }

  try {
    const users = await User.findAll({
      where: {
        username: {
          [Op.iLike]: `%${username}%`, // Case-insensitive search
        },
        id: {
          [Op.ne]: currentUserId, // Exclude current user from search results
        },
      },
      attributes: ["id", "username"],
      limit: 10, // Limit search results
    });

    // Optionally, for each found user, check friendship status with the current user
    const usersWithFriendshipStatus = await Promise.all(users.map(async (user) => {
        const friendship = await Friendship.findOne({
            where: {
                [Op.or]: [
                    { userId1: currentUserId, userId2: user.id },
                    { userId1: user.id, userId2: currentUserId },
                ]
            }
        });
        return {
            id: user.id,
            username: user.username,
            friendshipStatus: friendship ? friendship.status : null, // 'pending', 'accepted', 'blocked', or null
            isRequester: friendship ? (friendship.userId1 === currentUserId && friendship.status === 'pending') : false // True if current user sent a pending request
        };
    }));

    res.json(usersWithFriendshipStatus);
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ message: "Failed to search users.", error: error.message });
  }
};

// Send a friend request
exports.sendFriendRequest = async (req, res) => {
  const { recipientId } = req.body;
  const senderId = req.user.id;

  if (senderId === parseInt(recipientId)) {
    return res.status(400).json({ message: "Cannot send friend request to yourself." });
  }

  try {
    const recipient = await User.findByPk(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient user not found." });
    }

    const existingFriendship = await Friendship.findOne({
      where: {
        [Op.or]: [
          { userId1: senderId, userId2: recipientId },
          { userId1: recipientId, userId2: senderId },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === "accepted") {
        return res.status(400).json({ message: "You are already friends with this user." });
      } else if (existingFriendship.status === "pending") {
        if (existingFriendship.userId1 === senderId) {
            return res.status(400).json({ message: "Friend request already sent and pending." });
        } else {
            return res.status(400).json({ message: "This user has already sent you a friend request. Please respond to it." });
        }
      } else if (existingFriendship.status === "blocked") {
        return res.status(400).json({ message: "Cannot send friend request due to a block." });
      }
    }

    const friendship = await Friendship.create({
      userId1: senderId, 
      userId2: recipientId,
      status: "pending",
    });
    
    // Notify recipient via Socket.IO
    if (req.io) {
        const recipientSocket = req.io.users[recipientId]; // Assuming you store sockets by userId in req.io.users
        if (recipientSocket) {
            req.io.to(recipientSocket).emit("newFriendRequest", {
                id: friendship.id,
                sender: { id: senderId, username: req.user.username }, // Assuming req.user has username
                status: "pending",
                createdAt: friendship.createdAt
            });
        }
    }

    res.status(201).json({ message: "Friend request sent successfully.", friendship });
  } catch (error) {
    console.error("Send friend request error:", error);
    res.status(500).json({ message: "Failed to send friend request.", error: error.message });
  }
};

// Respond to a friend request (accept or reject)
exports.respondToFriendRequest = async (req, res) => {
  const { requestId } = req.params; 
  const { response } = req.body; 
  const currentUserId = req.user.id;

  if (!["accept", "reject"].includes(response)) {
    return res.status(400).json({ message: "Invalid response. Must be 'accept' or 'reject'." });
  }

  try {
    const friendshipRequest = await Friendship.findByPk(requestId);

    if (!friendshipRequest) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    if (friendshipRequest.userId2 !== currentUserId) {
      return res.status(403).json({ message: "You are not authorized to respond to this friend request." });
    }

    if (friendshipRequest.status !== "pending") {
      return res.status(400).json({ message: "This friend request has already been responded to or is not pending." });
    }

    const sender = await User.findByPk(friendshipRequest.userId1);

    if (response === "accept") {
      friendshipRequest.status = "accepted";
      await friendshipRequest.save();
      
      if (req.io) {
        // Notify sender
        const senderSocket = req.io.users[friendshipRequest.userId1];
        if (senderSocket) {
            req.io.to(senderSocket).emit("friendRequestAccepted", { 
                friendshipId: friendshipRequest.id, 
                friend: { id: currentUserId, username: req.user.username }, // The user who accepted
            });
        }
        // Notify self (accepter) to update their UI
        const currentUserSocket = req.io.users[currentUserId];
        if (currentUserSocket) {
            req.io.to(currentUserSocket).emit("friendRequestAccepted", { 
                friendshipId: friendshipRequest.id, 
                friend: { id: sender.id, username: sender.username }, // The user who sent the request
            });
        }
      }
      res.json({ message: "Friend request accepted.", friendship: friendshipRequest });
    } else { 
      const senderId = friendshipRequest.userId1;
      await friendshipRequest.destroy();
      if (req.io) {
        const senderSocket = req.io.users[senderId];
        if (senderSocket) {
            req.io.to(senderSocket).emit("friendRequestRejected", { 
                requestId: requestId, 
                recipientUsername: req.user.username 
            });
        }
      }
      res.json({ message: "Friend request rejected." });
    }
  } catch (error) {
    console.error("Respond to friend request error:", error);
    res.status(500).json({ message: "Failed to respond to friend request.", error: error.message });
  }
};

// List all friends (accepted friendships)
exports.listFriends = async (req, res) => {
  const userId = req.user.id;

  try {
    const friendships = await Friendship.findAll({
      where: {
        [Op.or]: [{ userId1: userId }, { userId2: userId }],
        status: "accepted",
      },
      include: [
        { model: User, as: "user1", attributes: ["id", "username"] },
        { model: User, as: "user2", attributes: ["id", "username"] },
      ],
    });

    const friends = friendships.map(f => {
      const friendUser = f.userId1 === userId ? f.user2 : f.user1;
      return {
        id: friendUser.id,
        username: friendUser.username,
        friendshipId: f.id, // Include the Friendship record ID
      };
    }).filter(friend => friend != null);

    res.json(friends);
  } catch (error) {
    console.error("List friends error:", error);
    res.status(500).json({ message: "Failed to retrieve friends list.", error: error.message });
  }
};

// List pending friend requests (requests sent to the current user)
exports.listPendingRequests = async (req, res) => {
    const userId = req.user.id;
    try {
        const requests = await Friendship.findAll({
            where: {
                userId2: userId, 
                status: "pending"
            },
            include: [{
                model: User,
                as: "user1", 
                attributes: ["id", "username"]
            }]
        });
        res.json(requests.map(r => ({ 
            id: r.id, // This is the Friendship record ID
            sender: r.user1, 
            status: r.status, 
            createdAt: r.createdAt 
        }) ));
    } catch (error) {
        console.error("List pending requests error:", error);
        res.status(500).json({ message: "Failed to retrieve pending friend requests.", error: error.message });
    }
};


// Remove a friend or cancel a sent request
exports.removeFriendship = async (req, res) => {
  const { friendshipId } = req.params; 
  const currentUserId = req.user.id;

  try {
    const friendship = await Friendship.findByPk(friendshipId);

    if (!friendship) {
      return res.status(404).json({ message: "Friendship record not found." });
    }

    if (friendship.userId1 !== currentUserId && friendship.userId2 !== currentUserId) {
      return res.status(403).json({ message: "You are not authorized to modify this friendship record." });
    }
    
    // Determine the other user involved for notification purposes
    const otherUserId = friendship.userId1 === currentUserId ? friendship.userId2 : friendship.userId1;

    const initialStatus = friendship.status;
    await friendship.destroy();
    
    if (req.io) {
        const otherUserSocket = req.io.users[otherUserId];
        if (otherUserSocket) {
            req.io.to(otherUserSocket).emit("friendshipRemoved", { friendshipId: friendshipId, removedBy: currentUserId });
        }
        // Notify self too, to update UI
        const currentUserSocket = req.io.users[currentUserId];
        if (currentUserSocket) {
            req.io.to(currentUserSocket).emit("friendshipRemoved", { friendshipId: friendshipId, removedBy: currentUserId });
        }
    }

    if (initialStatus === "accepted") {
        res.json({ message: `Successfully unfriended.` });
    } else if (initialStatus === "pending" && friendship.userId1 === currentUserId) {
        res.json({ message: "Friend request successfully cancelled." });
    } else {
        res.json({ message: "Friendship record removed." });
    }

  } catch (error) {
    console.error("Remove friendship error:", error);
    res.status(500).json({ message: "Failed to remove friendship.", error: error.message });
  }
};

