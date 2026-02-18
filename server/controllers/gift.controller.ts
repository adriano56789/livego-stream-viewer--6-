import { Request, Response } from 'express';
import Gift from '../routes/models/Gift';
import User, { IUser } from '../routes/models/User';
import Transaction from '../routes/models/Transaction';
import Stream, { IStream } from '../routes/models/Stream';
import Notification, { NotificationType } from '../routes/models/Notification';

export const getGifts = async (req: Request, res: Response) => {
  try {
    const gifts = await Gift.find({ isActive: true });
    res.json(gifts);
  } catch (error) {
    console.error('Error in getGifts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendGift = async (req: Request, res: Response) => {
  try {
    const { giftId, streamId, message } = req.body;
    const senderId = req.user.id;

    // Find the gift
    const gift = await Gift.findById(giftId);
    if (!gift || !gift.isActive) {
      return res.status(404).json({ message: 'Gift not found or inactive' });
    }

    // Find sender and receiver (streamer)
    const [sender, stream] = await Promise.all([
      User.findById(senderId),
      Stream.findById(streamId).populate<{ streamer: IUser }>('streamer', 'id diamonds')
    ]);

    if (!sender || !stream) {
      return res.status(404).json({ message: 'Sender or stream not found' });
    }

    // Check if sender has enough diamonds
    if (sender.diamonds < gift.value) {
      return res.status(400).json({ message: 'Not enough diamonds' });
    }

    // Deduct diamonds from sender
    sender.diamonds -= gift.value;
    
    // Add diamonds to receiver (streamer)
    (stream.streamer as any).diamonds += gift.value;

    // Create transaction record
    const transaction = new Transaction({
      user: senderId,
      type: 'GIFT_SENT',
      amount: -gift.value,
      description: `Sent ${gift.name} to ${(stream.streamer as any).name}`,
      metadata: {
        giftId: gift._id,
        giftName: gift.name,
        recipient: stream.streamer._id,
        streamId: stream._id
      }
    });

    // Create notification for receiver
    const notification = new Notification({
      user: stream.streamer._id,
      type: NotificationType.GIFT_RECEIVED,
      title: 'New Gift Received',
      message: `${sender.name} sent you a ${gift.name}`,
      isRead: false,
      relatedUser: sender._id,
      relatedStream: stream._id,
      metadata: {
        giftId: gift._id,
        giftName: gift.name,
        giftValue: gift.value
      }
    });

    // Save all changes in a transaction
    await Promise.all([
      sender.save(),
      stream.streamer.save(),
      transaction.save(),
      notification.save()
    ]);

    // Emit WebSocket event
    // webSocketService.broadcastToStream(streamId, {
    //   type: 'GIFT_SENT',
    //   user: sender,
    //   gift,
    //   message,
    //   timestamp: new Date()
    // });

    res.json({
      success: true,
      message: 'Gift sent successfully',
      diamonds: sender.diamonds
    });
  } catch (error) {
    console.error('Error in sendGift:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getGiftHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const history = await Transaction.find({
      user: userId,
      type: { $in: ['GIFT_SENT', 'GIFT_RECEIVED'] }
    })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('metadata.recipient', 'name avatar')
      .populate('metadata.sender', 'name avatar');

    const total = await Transaction.countDocuments({
      user: userId,
      type: { $in: ['GIFT_SENT', 'GIFT_RECEIVED'] }
    });

    res.json({
      success: true,
      data: history,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error in getGiftHistory:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTopGifters = async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;
    
    // Get top gifters for a specific stream
    const topGifters = await Transaction.aggregate([
      {
        $match: {
          'metadata.streamId': streamId,
          type: 'GIFT_SENT'
        }
      },
      {
        $group: {
          _id: '$user',
          totalGifts: { $sum: 1 },
          totalValue: { $sum: { $abs: '$amount' } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          user: {
            id: '$user._id',
            name: '$user.name',
            avatar: '$user.avatar',
            level: '$user.level'
          },
          totalGifts: 1,
          totalValue: 1
        }
      },
      { $sort: { totalValue: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: topGifters
    });
  } catch (error) {
    console.error('Error in getTopGifters:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
