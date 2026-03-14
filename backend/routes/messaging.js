const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');

// ─────────────────────────────────────────
// SCHEMAS (inline — add to models/ later)
// ─────────────────────────────────────────

const ConversationSchema = new mongoose.Schema({
  providerId:    { type: String, required: true, index: true },
  patientId:     { type: String, required: true, index: true },
  programId:     { type: String, default: 'musclefirst' },
  createdAt:     { type: Date, default: Date.now },
  lastMessageAt: { type: Date, default: Date.now },
});
ConversationSchema.index({ providerId: 1, patientId: 1, programId: 1 }, { unique: true });

const MessageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, index: true },
  senderId:       { type: String, required: true },
  senderRole:     { type: String, enum: ['patient', 'provider'], required: true },
  body:           { type: String, required: true },
  timestamp:      { type: Date, default: Date.now },
  read:           { type: Boolean, default: false },
});

const Conversation = mongoose.models.Conversation
  || mongoose.model('Conversation', ConversationSchema);
const Message = mongoose.models.Message
  || mongoose.model('Message', MessageSchema);

// ─────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────

/**
 * POST /api/messaging/conversations/find-or-create
 * Body: { providerId, programId? }
 * Auth: patient JWT
 * Returns: { conversationId }
 */
router.post('/conversations/find-or-create', authenticateToken, async (req, res) => {
  try {
    const patientId  = req.userId || req.user.userId;
    const { providerId, programId = 'musclefirst' } = req.body;

    if (!providerId) {
      return res.status(400).json({ success: false, message: 'providerId required' });
    }

    let convo = await Conversation.findOne({ providerId, patientId, programId });

    if (!convo) {
      convo = await Conversation.create({ providerId, patientId, programId });
    }

    res.json({ success: true, conversationId: convo._id.toString() });
  } catch (err) {
    console.error('[Messaging] find-or-create error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/messaging/messages/:conversationId
 * Auth: either patient or provider JWT
 * Returns: { messages: [...] }
 */
router.get('/messages/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const since = req.query.since; // optional ISO timestamp for polling delta

    const query = { conversationId };
    if (since) {
      query.timestamp = { $gt: new Date(since) };
    }

    const messages = await Message.find(query).sort({ timestamp: 1 }).lean();

    // Mark unread messages as read for the requesting user
    const userId = (req.userId || req.user.userId).toString();
    await Message.updateMany(
      { conversationId, senderId: { $ne: userId }, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true, messages });
  } catch (err) {
    console.error('[Messaging] fetch messages error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/messaging/messages
 * Body: { conversationId, body, senderRole }
 * Auth: patient or provider JWT
 * Returns: { message: {...} }
 */
router.post('/messages', authenticateToken, async (req, res) => {
  try {
    const senderId   = (req.userId || req.user.userId).toString();
    const { conversationId, body, senderRole } = req.body;

    if (!conversationId || !body || !senderRole) {
      return res.status(400).json({ success: false, message: 'conversationId, body, senderRole required' });
    }

    const message = await Message.create({ conversationId, senderId, senderRole, body });

    // Update lastMessageAt on conversation
    await Conversation.findByIdAndUpdate(conversationId, { lastMessageAt: new Date() });

    res.json({ success: true, message });
  } catch (err) {
    console.error('[Messaging] send message error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/messaging/conversations
 * Auth: provider JWT — returns all conversations for this provider
 */
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const providerId = (req.userId || req.user.userId).toString();
    const conversations = await Conversation.find({ providerId })
      .sort({ lastMessageAt: -1 })
      .lean();
    res.json({ success: true, conversations });
  } catch (err) {
    console.error('[Messaging] list conversations error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/messaging/unread-count
 * Auth: patient or provider JWT
 * Returns: { count: N } — only messages in conversations this user is part of
 */
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = (req.userId || req.user.userId).toString();

    // Find all conversations this user is a participant in
    const convos = await Conversation.find({
      $or: [{ patientId: userId }, { providerId: userId }]
    }).select('_id').lean();

    const convoIds = convos.map(c => c._id.toString());

    const count = await Message.countDocuments({
      conversationId: { $in: convoIds },
      senderId:       { $ne: userId },
      read:           false,
    });

    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
