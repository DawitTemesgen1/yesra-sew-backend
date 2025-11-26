const express = require('express');
const { auth } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();

// Get all conversations for user
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [conversations] = await pool.execute(`
      SELECT 
        c.id as conversation_id,
        u.id as participant_id,
        u.full_name as participant_name,
        u.email,
        cm.message as last_message,
        cm.created_at as last_message_time,
        (SELECT COUNT(*) FROM chat_messages cm2 
         WHERE cm2.conversation_id = c.id AND cm2.sender_id != ? AND cm2.is_read = FALSE) as unread_count
      FROM chat_conversations c
      JOIN users u ON (u.id = c.participant1_id OR u.id = c.participant2_id) AND u.id != ?
      LEFT JOIN chat_messages cm ON cm.id = (
        SELECT id FROM chat_messages 
        WHERE conversation_id = c.id 
        ORDER BY created_at DESC 
        LIMIT 1
      )
      WHERE c.participant1_id = ? OR c.participant2_id = ?
      ORDER BY cm.created_at DESC
    `, [userId, userId, userId, userId]);

    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify user is part of conversation
    const [conversations] = await pool.execute(
      'SELECT * FROM chat_conversations WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)',
      [conversationId, userId, userId]
    );

    if (conversations.length === 0) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const [messages] = await pool.execute(`
      SELECT 
        cm.*,
        u.full_name as sender_name
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE cm.conversation_id = ?
      ORDER BY cm.created_at ASC
    `, [conversationId]);

    // Mark messages as read
    await pool.execute(
      'UPDATE chat_messages SET is_read = TRUE WHERE conversation_id = ? AND sender_id != ? AND is_read = FALSE',
      [conversationId, userId]
    );

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start a new conversation or get existing one
router.post('/conversations', auth, async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user.id;

    if (userId === parseInt(participantId)) {
      return res.status(400).json({ message: 'Cannot start conversation with yourself' });
    }

    // Check if conversation already exists
    const [existingConversations] = await pool.execute(
      `SELECT * FROM chat_conversations 
       WHERE (participant1_id = ? AND participant2_id = ?) 
       OR (participant1_id = ? AND participant2_id = ?)`,
      [userId, participantId, participantId, userId]
    );

    if (existingConversations.length > 0) {
      return res.json(existingConversations[0]);
    }

    // Create new conversation
    const [result] = await pool.execute(
      'INSERT INTO chat_conversations (participant1_id, participant2_id) VALUES (?, ?)',
      [userId, participantId]
    );

    const [newConversation] = await pool.execute(
      'SELECT * FROM chat_conversations WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newConversation[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    // Verify user is part of conversation
    const [conversations] = await pool.execute(
      'SELECT * FROM chat_conversations WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)',
      [conversationId, userId, userId]
    );

    if (conversations.length === 0) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const [result] = await pool.execute(
      'INSERT INTO chat_messages (conversation_id, sender_id, message) VALUES (?, ?, ?)',
      [conversationId, userId, message.trim()]
    );

    const [newMessage] = await pool.execute(`
      SELECT 
        cm.*,
        u.full_name as sender_name
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE cm.id = ?
    `, [result.insertId]);

    res.status(201).json(newMessage[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread message count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await pool.execute(`
      SELECT COUNT(*) as unread_count
      FROM chat_messages cm
      JOIN chat_conversations c ON cm.conversation_id = c.id
      WHERE (c.participant1_id = ? OR c.participant2_id = ?)
      AND cm.sender_id != ?
      AND cm.is_read = FALSE
    `, [userId, userId, userId]);

    res.json({ unread_count: result[0].unread_count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;