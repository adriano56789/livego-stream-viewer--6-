import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../routes/models/User';

/**
 * Get user's profile images
 */
export const getProfileImages = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select('profile.images');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.profile.images || []);
  } catch (error) {
    console.error('Error getting profile images:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a profile image
 */
export const deleteProfileImage = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Filter out the image with the given ID
    user.profile.images = user.profile.images.filter(
      (img: any) => img._id.toString() !== id
    );
    
    await user.save();
    
    res.json({ success: true, images: user.profile.images });
  } catch (error) {
    console.error('Error deleting profile image:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Reorder profile images
 */
export const reorderProfileImages = async (req: any, res: Response) => {
  try {
    const { orderedIds } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create a map of ID to image for quick lookup
    const imageMap = new Map();
    user.profile.images.forEach((img: any) => {
      imageMap.set(img._id.toString(), img);
    });
    
    // Reorder images based on the provided order
    const reorderedImages = orderedIds
      .map((id: string) => imageMap.get(id))
      .filter((img: any) => img); // Filter out any undefined (in case of invalid IDs)
    
    // Update the user's images
    user.profile.images = reorderedImages;
    await user.save();
    
    res.json({ success: true, images: user.profile.images });
  } catch (error) {
    console.error('Error reordering profile images:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get a specific profile field
 */
export const getProfileField = async (
  req: any, 
  res: Response, 
  next: NextFunction, 
  field: string
) => {
  try {
    const user = await User.findById(req.user._id).select(`profile.${field}`);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Handle nested fields if needed
    const fieldValue = field.includes('.') 
      ? field.split('.').reduce((obj, key) => obj?.[key], user.profile)
      : user.profile[field];
    
    res.json({ value: fieldValue });
  } catch (error) {
    console.error(`Error getting profile field ${field}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update a specific profile field
 */
export const updateProfileField = async (
  req: any, 
  res: Response, 
  next: NextFunction, 
  field: string
) => {
  try {
    const { value } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Handle nested fields if needed
    if (field.includes('.')) {
      const fields = field.split('.');
      let obj = user.profile;
      for (let i = 0; i < fields.length - 1; i++) {
        if (!obj[fields[i]]) obj[fields[i]] = {};
        obj = obj[fields[i]];
      }
      obj[fields[fields.length - 1]] = value;
    } else {
      user.profile[field] = value;
    }
    
    await user.save();
    
    res.json({ success: true, user });
  } catch (error) {
    console.error(`Error updating profile field ${field}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Upload a new profile image
 */
export const uploadProfileImage = async (req: any, res: Response) => {
  try {
    // This would typically handle file upload via multer or similar middleware
    // For now, we'll assume the file is already processed and the URL is in req.file
    const imageUrl = req.file?.path || req.body.imageUrl;
    
    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Add the new image to the user's profile
    user.profile.images.push({ url: imageUrl });
    await user.save();
    
    res.status(201).json({ 
      success: true, 
      image: { url: imageUrl, _id: user.profile.images[user.profile.images.length - 1]._id },
      images: user.profile.images
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
