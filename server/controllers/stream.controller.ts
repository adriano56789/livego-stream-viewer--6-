import { Request, Response } from 'express';
import Stream from '../routes/models/Stream';
import { startStream, endStream, getStream, listStreams, updateStream } from '../services/stream.service';

export const createStream = async (req: Request, res: Response) => {
  try {
    const { title, description, category, tags } = req.body;
    const streamer = req.user.id;

    const stream = await startStream({
      title,
      description,
      streamer,
      category,
      tags,
    });

    res.status(201).json(stream);
  } catch (error) {
    console.error('Error in createStream:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const stopStream = async (req: Request, res: Response) => {
  try {
    const streamId = Array.isArray(req.params.streamId) ? req.params.streamId[0] : req.params.streamId;
    const stream = await endStream(streamId, req.user.id);
    
    if (!stream) {
      return res.status(404).json({ message: 'Stream not found or unauthorized' });
    }
    
    res.json({ message: 'Stream ended successfully', stream });
  } catch (error) {
    console.error('Error in stopStream:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getStreamInfo = async (req: Request, res: Response) => {
  try {
    const streamId = Array.isArray(req.params.streamId) ? req.params.streamId[0] : req.params.streamId;
    const stream = await getStream(streamId);
    
    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }
    
    res.json(stream);
  } catch (error) {
    console.error('Error in getStreamInfo:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllStreams = async (req: Request, res: Response) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const query: any = { isLive: true };
    
    if (category) {
      query.category = category;
    }
    
    const streams = await listStreams({
      query,
      page: Number(page),
      limit: Number(limit)
    });
    
    res.json(streams);
  } catch (error) {
    console.error('Error in getAllStreams:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateStreamInfo = async (req: Request, res: Response) => {
  try {
    const streamId = Array.isArray(req.params.streamId) ? req.params.streamId[0] : req.params.streamId;
    const { title, description, category, tags } = req.body;
    
    const updatedStream = await updateStream(streamId, req.user.id, {
      title,
      description,
      category,
      tags
    });
    
    if (!updatedStream) {
      return res.status(404).json({ message: 'Stream not found or unauthorized' });
    }
    
    res.json(updatedStream);
  } catch (error) {
    console.error('Error in updateStreamInfo:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendChatMessage = async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;
    
    // This would typically be handled by WebSocket
    // For REST, we'll just save the message to the database
    const stream = await Stream.findById(streamId);
    
    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }
    
    stream.chatMessages.push({
        user: userId,
        message,
        timestamp: new Date(),
        isGift: false
    });
    
    await stream.save();
    
    // In a real app, you would emit this message via WebSocket
    // webSocketService.broadcastToStream(streamId, {
    //   type: 'CHAT_MESSAGE',
    //   user: userId,
    //   message,
    //   timestamp: new Date()
    // });
    
    res.status(201).json({ message: 'Message sent' });
  } catch (error) {
    console.error('Error in sendChatMessage:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
