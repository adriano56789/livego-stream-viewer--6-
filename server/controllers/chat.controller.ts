import { Request, Response } from 'express';
import Message from '../routes/models/Message';
import { NotFoundError } from '../errors/request-validation-error';

// Get chat messages
export const getChatMessages = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { before, limit = 50 } = req.query;

    const query: any = { conversation: conversationId };
    if (before) {
      query.createdAt = { $lt: new Date(before as string) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('sender', 'username avatar')
      .lean();

    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

// Send a message
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { conversationId, content, replyTo, attachments = [] } = req.body;
    const userId = req.user?.id;

    const message = new Message({
      conversation: conversationId,
      sender: userId,
      content,
      replyTo,
      attachments,
      readBy: [userId],
      isEdited: false,
      reactions: [],
      deletedFor: [],
    });

    await message.save();
    
    // Populate sender info before sending response
    const populatedMessage = await Message.populate(message, {
      path: 'sender',
      select: 'username avatar',
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
};

// Delete a message
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;

    const message = await Message.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Check if user is the sender or has admin rights
    if (message.sender.toString() !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    // Soft delete: add user to deletedFor array
    if (!message.deletedFor.includes(userId)) {
      message.deletedFor.push(userId);
      await message.save();
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    if (error instanceof NotFoundError) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error deleting message' });
  }
};

// Get user conversations
export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    // Get distinct conversations where user is a participant
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { 'participants.user': userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversation',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $not: [{ $in: [userId, '$readBy'] }] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.sender',
          foreignField: '_id',
          as: 'sender'
        }
      },
      {
        $unwind: '$sender'
      },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          unreadCount: 1,
          'sender.username': 1,
          'sender.avatar': 1
        }
      }
    ]);

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Error fetching conversations' });
  }
};

// Get conversation with a specific user
export const getConversation = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    // Find or create a conversation between the two users
    // This is a simplified version - you might want to use a separate Conversation model
    const conversation = {
      _id: [currentUserId, userId].sort().join('_'),
      participants: [currentUserId, userId],
      isGroup: false
    };

    res.json(conversation);
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({ message: 'Error getting conversation' });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req: Request, res: Response) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user?.id;

    await Message.updateMany(
      { _id: { $in: messageIds }, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Error marking messages as read' });
  }
};

// Get unread messages count
export const getUnreadMessagesCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const count = await Message.countDocuments({
      'participants.user': userId,
      readBy: { $ne: userId }
    });

    res.json({ count });
  } catch (error) {
    console.error('Error getting unread messages count:', error);
    res.status(500).json({ message: 'Error getting unread messages count' });
  }
};

// Get chat permissions
export const getChatPermissions = async (req: Request, res: Response) => {
  try {
    // In a real app, this would check user's role and permissions
    const permissions = {
      canSendMessages: true,
      canSendMedia: true,
      canSendGifts: true,
      isBanned: false,
      banReason: '',
      muteExpiration: null
    };

    res.json(permissions);
  } catch (error) {
    console.error('Error getting chat permissions:', error);
    res.status(500).json({ message: 'Error getting chat permissions' });
  }
};

// Update chat permissions (admin only)
export const updateChatPermissions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { canSendMessages, canSendMedia, isBanned, banReason, muteDuration } = req.body;

    // In a real app, this would update the user's permissions in the database
    // and handle any necessary notifications or logging

    res.json({
      message: 'Chat permissions updated successfully',
      permissions: {
        userId,
        canSendMessages,
        canSendMedia,
        isBanned,
        banReason,
        muteExpiration: muteDuration ? new Date(Date.now() + muteDuration * 60 * 1000) : null
      }
    });
  } catch (error) {
    console.error('Error updating chat permissions:', error);
    res.status(500).json({ message: 'Error updating chat permissions' });
  }
};
