import { Types } from 'mongoose';
import Stream, { IStream } from '../routes/models/Stream';

interface CreateStreamInput {
  title: string;
  description: string;
  streamer: Types.ObjectId;
  category: string;
  tags: string[];
}

export const startStream = async (data: CreateStreamInput): Promise<IStream> => {
  const stream = new Stream({
    ...data,
    isLive: true,
    startTime: new Date(),
    viewers: 0,
    chatMessages: [],
    viewersHistory: []
  });
  
  return await stream.save();
};

export const endStream = async (streamId: string, streamerId: Types.ObjectId): Promise<IStream | null> => {
  const stream = await Stream.findOneAndUpdate(
    { _id: streamId, streamer: streamerId, isLive: true },
    { 
      $set: { 
        isLive: false, 
        endTime: new Date() 
      } 
    },
    { new: true }
  );
  
  return stream;
};

export const getStream = async (streamId: string): Promise<IStream | null> => {
  return await Stream.findById(streamId)
    .populate('streamer', 'name avatar')
    .populate('chatMessages.user', 'name avatar');
};

interface ListStreamsOptions {
  query: any;
  page: number;
  limit: number;
}

export const listStreams = async ({ 
  query, 
  page = 1, 
  limit = 10 
}: ListStreamsOptions) => {
  const skip = (page - 1) * limit;
  
  const [streams, total] = await Promise.all([
    Stream.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('streamer', 'name avatar'),
    Stream.countDocuments(query)
  ]);
  
  return {
    streams,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page
  };
};

export const updateStream = async (
  streamId: string, 
  streamerId: Types.ObjectId,
  updateData: Partial<CreateStreamInput>
): Promise<IStream | null> => {
  return await Stream.findOneAndUpdate(
    { _id: streamId, streamer: streamerId },
    { $set: updateData },
    { new: true }
  );
};
