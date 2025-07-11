const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get or create chat for a task
router.get('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Find existing chat for this task
    let chat = await Chat.findOne({ taskId })
      .populate('participants', 'name profilePicture')
      .populate('messages.sender', 'name profilePicture')
      .populate('messages.readBy.user', 'name');

    if (!chat) {
      // Create new chat if it doesn't exist
      chat = new Chat({
        taskId,
        participants: [userId]
      });
      await chat.save();
      
      chat = await Chat.findById(chat._id)
        .populate('participants', 'name profilePicture')
        .populate('messages.sender', 'name profilePicture')
        .populate('messages.readBy.user', 'name');
    } else if (!chat.participants.includes(userId)) {
      // Add user to participants if not already included
      chat.participants.push(userId);
      await chat.save();
    }

    res.json(chat);
  } catch (error) {
    console.error('Error getting chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/task/:taskId/message', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, messageType = 'text', fileUrl, fileName, fileSize } = req.body;
    const senderId = req.user.id;

    let chat = await Chat.findOne({ taskId });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Add message to chat
    const message = {
      sender: senderId,
      content,
      messageType,
      fileUrl,
      fileName,
      fileSize,
      readBy: [{ user: senderId, readAt: new Date() }]
    };

    chat.messages.push(message);
    chat.lastMessage = new Date();
    await chat.save();

    // Populate the new message for response
    const populatedChat = await Chat.findById(chat._id)
      .populate('messages.sender', 'name profilePicture')
      .populate('messages.readBy.user', 'name');

    const newMessage = populatedChat.messages[populatedChat.messages.length - 1];

    // Emit to all participants via WebSocket
    chat.participants.forEach(participantId => {
      if (participantId.toString() !== senderId) {
        req.io.to(participantId.toString()).emit('new_message', {
          taskId,
          message: newMessage
        });
      }
    });

    res.json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.put('/task/:taskId/read', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findOne({ taskId });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Mark all unread messages as read
    chat.messages.forEach(message => {
      const alreadyRead = message.readBy.some(read => read.user.toString() === userId);
      if (!alreadyRead) {
        message.readBy.push({ user: userId, readAt: new Date() });
      }
    });

    await chat.save();
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's chats
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.find({ 
      participants: userId,
      isActive: true 
    })
    .populate('participants', 'name profilePicture')
    .populate('messages.sender', 'name profilePicture')
    .sort({ lastMessage: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Error getting user chats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 