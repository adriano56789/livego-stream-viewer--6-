"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unfollowUser = exports.followUser = exports.updateProfile = exports.getProfile = void 0;
const User_1 = __importDefault(require("../../models/User"));
const getProfile = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.userId)
            .select('-password')
            .populate('followers following', 'name avatar');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Error in getProfile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        const { name, avatar, bio } = req.body;
        const user = await User_1.default.findByIdAndUpdate(req.user.id, { $set: { name, avatar, bio } }, { new: true }).select('-password');
        res.json(user);
    }
    catch (error) {
        console.error('Error in updateProfile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateProfile = updateProfile;
const followUser = async (req, res) => {
    try {
        const userToFollow = await User_1.default.findById(req.params.userId);
        const currentUser = await User_1.default.findById(req.user.id);
        if (!userToFollow || !currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Check if already following
        if (currentUser.following.some(id => id.equals(userToFollow._id))) {
            return res.status(400).json({ message: 'Already following this user' });
        }
        // Add to following list
        currentUser.following.push(userToFollow._id);
        await currentUser.save();
        // Add to followers list
        userToFollow.followers.push(currentUser._id);
        await userToFollow.save();
        res.json({ message: 'User followed successfully' });
    }
    catch (error) {
        console.error('Error in followUser:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.followUser = followUser;
const unfollowUser = async (req, res) => {
    try {
        const userToUnfollow = await User_1.default.findById(req.params.userId);
        const currentUser = await User_1.default.findById(req.user.id);
        if (!userToUnfollow || !currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Remove from following list
        currentUser.following = currentUser.following.filter(id => !id.equals(userToUnfollow._id));
        await currentUser.save();
        // Remove from followers list
        userToUnfollow.followers = userToUnfollow.followers.filter(id => !id.equals(currentUser._id));
        await userToUnfollow.save();
        res.json({ message: 'User unfollowed successfully' });
    }
    catch (error) {
        console.error('Error in unfollowUser:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.unfollowUser = unfollowUser;
