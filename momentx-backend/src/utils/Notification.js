import Notification from '../models/Notification.model.js';

export const sendNotification = async ({
  req,
  receiverId,
  type,
  postId = null,
  commentId = null,
  story = null,
  reelId = null,
}) => {
  try {
    const senderId = req.user._id;

    // 1. Prevent self-notifications (e.g., liking own post)
    if (senderId.toString() === receiverId.toString()) return;

    // 2. Create Notification in DB
    const notification = await Notification.create({
      user: receiverId,
      sender: senderId,
      type,
      post: postId,
      comment: commentId,
      story: story,
      reel: reelId,
    });

    // 3. Populate sender info for real-time UI
    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'username profilePic')
      .populate('post', 'images') // To show post thumbnail if it's a like/comment
      .populate('reel', 'video videoUrl thumbnail image') // ✅ POPULATE REEL MEDIA
      .populate('story', 'url type'); // To show story info if applicable

    // 4. Emit Socket Event to Receiver's Room
    if (req.io) {
      req.io
        .to(receiverId.toString())
        .emit('new_notification', populatedNotification);
    }
  } catch (error) {
    console.error('❌ Notification Error:', error);
  }
};
