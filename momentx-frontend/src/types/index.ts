export interface User {
  _id: string;
  username: string;
  name: string;
  profilePic: string; // Backend sends profilePic
  isVerified: boolean;
}

export interface Post {
  _id: string;
  user: User;
  caption: string;
  images: string[]; // Array of URLs
  location: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
  hashtags: string[];
}

export interface Comment {
  _id: string;
  user: User;
  text: string;
  createdAt: string;
  likes: any[];
  parentComment?: string | null; // ✅ Add this
}
