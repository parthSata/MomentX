export interface User {
  _id: string;
  username: string;
  name: string;
  profilePic: string; // Backend sends profilePic
  profilePicThumbnail: string; // Backend sends profilePicThumbnail
  isVerified: boolean;
  following: string[]; // Array of user IDs
}

export interface Post {
  _id: string;
  user: User;
  caption: string;
  images: string[]; // Array of URLs
  thumbnails: string[]; // Array of compressed URLs
  location: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
  hashtags: string[];
  videoUrl: string; // Optional video URL
  commentsCount: number;
  viewsCount: number;
}

export interface Comment {
  _id: string;
  user: User;
  text: string;
  createdAt: string;
  likes: any[];
  parentComment?: string | null; // ✅ Add this
}
