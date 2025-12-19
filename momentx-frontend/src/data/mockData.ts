// Mock data for MomentX social media platform

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  website: string;
  isVerified: boolean;
  followers: number;
  following: number;
  posts: number;
  isOnline?: boolean;
}

export interface Post {
  id: string;
  user: User;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
  hashtags: string[];
}

export interface Story {
  id: string;
  user: User;
  items: StoryItem[];
  isViewed: boolean;
}

export interface StoryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  duration: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  type: 'text' | 'image' | 'voice';
  isRead: boolean;
}

export interface Chat {
  id: string;
  user: User;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  messages: Message[];
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'message';
  user: User;
  content: string;
  timestamp: string;
  isRead: boolean;
  postImage?: string;
}

export interface Reel {
  id: string;
  user: User;
  videoUrl: string;
  thumbnail: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  music?: string;
  isLiked: boolean;
}

export const currentUser: User = {
  id: 'current',
  username: 'alex.moment',
  displayName: 'Alex Johnson',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
  bio: '✨ Living in the moment | 📸 Photography enthusiast | 🌍 Travel lover',
  website: 'momentx.app/alex',
  isVerified: true,
  followers: 24500,
  following: 892,
  posts: 156,
};

export const users: User[] = [
  {
    id: '1',
    username: 'sarah.captures',
    displayName: 'Sarah Williams',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    bio: 'Photographer | Dreamer',
    website: 'sarahcaptures.com',
    isVerified: true,
    followers: 125000,
    following: 450,
    posts: 892,
    isOnline: true,
  },
  {
    id: '2',
    username: 'mike.travel',
    displayName: 'Mike Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    bio: 'World Explorer 🌎',
    website: 'miketravel.io',
    isVerified: false,
    followers: 45000,
    following: 1200,
    posts: 567,
    isOnline: false,
  },
  {
    id: '3',
    username: 'emma.design',
    displayName: 'Emma Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    bio: 'UI/UX Designer ✨',
    website: 'emmadesign.co',
    isVerified: true,
    followers: 89000,
    following: 320,
    posts: 234,
    isOnline: true,
  },
  {
    id: '4',
    username: 'james.creative',
    displayName: 'James Wilson',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    bio: 'Creative Director',
    website: 'jamescreative.art',
    isVerified: false,
    followers: 32000,
    following: 890,
    posts: 445,
    isOnline: true,
  },
  {
    id: '5',
    username: 'lisa.moments',
    displayName: 'Lisa Park',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
    bio: 'Living life one moment at a time',
    website: 'lisapark.me',
    isVerified: true,
    followers: 156000,
    following: 234,
    posts: 1023,
    isOnline: false,
  },
  {
    id: '6',
    username: 'david.shots',
    displayName: 'David Kim',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
    bio: 'Photographer | LA based',
    website: 'davidshots.com',
    isVerified: false,
    followers: 28000,
    following: 567,
    posts: 312,
    isOnline: true,
  },
];

export const posts: Post[] = [
  {
    id: '1',
    user: users[0],
    image: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&h=800&fit=crop',
    caption: 'Capturing the golden hour magic ✨ Sometimes the best moments are the unexpected ones.',
    likes: 12453,
    comments: 234,
    shares: 89,
    isLiked: false,
    isSaved: false,
    createdAt: '2 hours ago',
    hashtags: ['photography', 'goldenhour', 'momentx'],
  },
  {
    id: '2',
    user: users[1],
    image: 'https://images.unsplash.com/photo-1682686581498-5e85c7228119?w=800&h=800&fit=crop',
    caption: 'Adventures await around every corner 🌍 Never stop exploring!',
    likes: 8932,
    comments: 156,
    shares: 45,
    isLiked: true,
    isSaved: true,
    createdAt: '5 hours ago',
    hashtags: ['travel', 'adventure', 'explore'],
  },
  {
    id: '3',
    user: users[2],
    image: 'https://images.unsplash.com/photo-1682695797221-8164ff1fafc9?w=800&h=800&fit=crop',
    caption: 'Design is not just what it looks like, design is how it works 💫',
    likes: 15678,
    comments: 423,
    shares: 167,
    isLiked: false,
    isSaved: false,
    createdAt: '8 hours ago',
    hashtags: ['design', 'creativity', 'inspiration'],
  },
  {
    id: '4',
    user: users[3],
    image: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=800&h=800&fit=crop',
    caption: 'Creating magic one project at a time 🎨',
    likes: 6234,
    comments: 89,
    shares: 23,
    isLiked: true,
    isSaved: false,
    createdAt: '12 hours ago',
    hashtags: ['art', 'creative', 'studio'],
  },
  {
    id: '5',
    user: users[4],
    image: 'https://images.unsplash.com/photo-1682695796497-31a44224d6d6?w=800&h=800&fit=crop',
    caption: 'Every sunset brings the promise of a new dawn 🌅',
    likes: 23456,
    comments: 567,
    shares: 234,
    isLiked: false,
    isSaved: true,
    createdAt: '1 day ago',
    hashtags: ['sunset', 'nature', 'peace'],
  },
];

export const stories: Story[] = [
  {
    id: '1',
    user: currentUser,
    items: [
      { id: '1', type: 'image', url: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600', duration: 5 },
    ],
    isViewed: false,
  },
  ...users.map((user, index) => ({
    id: `story-${user.id}`,
    user,
    items: [
      { id: `item-${index}`, type: 'image' as const, url: `https://images.unsplash.com/photo-168268722${index}742-aba13b6e50ba?w=600`, duration: 5 },
    ],
    isViewed: index > 2,
  })),
];

export const chats: Chat[] = users.slice(0, 5).map((user, index) => ({
  id: `chat-${user.id}`,
  user,
  lastMessage: [
    'Hey! Love your latest post 😍',
    'Are you coming to the event?',
    'Thanks for the follow! 🙏',
    'Let\'s collab sometime!',
    'That photo was amazing!',
  ][index],
  timestamp: ['2m', '15m', '1h', '3h', '1d'][index],
  unreadCount: [2, 0, 1, 0, 0][index],
  messages: [
    {
      id: '1',
      senderId: user.id,
      text: 'Hey there! 👋',
      timestamp: '10:00 AM',
      type: 'text',
      isRead: true,
    },
    {
      id: '2',
      senderId: 'current',
      text: 'Hi! How are you?',
      timestamp: '10:02 AM',
      type: 'text',
      isRead: true,
    },
    {
      id: '3',
      senderId: user.id,
      text: [
        'Hey! Love your latest post 😍',
        'Are you coming to the event?',
        'Thanks for the follow! 🙏',
        'Let\'s collab sometime!',
        'That photo was amazing!',
      ][index],
      timestamp: '10:05 AM',
      type: 'text',
      isRead: index !== 0 && index !== 2,
    },
  ],
}));

export const notifications: Notification[] = [
  {
    id: '1',
    type: 'like',
    user: users[0],
    content: 'liked your photo',
    timestamp: '2m ago',
    isRead: false,
    postImage: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=100',
  },
  {
    id: '2',
    type: 'follow',
    user: users[1],
    content: 'started following you',
    timestamp: '15m ago',
    isRead: false,
  },
  {
    id: '3',
    type: 'comment',
    user: users[2],
    content: 'commented: "This is amazing! 🔥"',
    timestamp: '1h ago',
    isRead: true,
    postImage: 'https://images.unsplash.com/photo-1682695797221-8164ff1fafc9?w=100',
  },
  {
    id: '4',
    type: 'mention',
    user: users[3],
    content: 'mentioned you in a comment',
    timestamp: '3h ago',
    isRead: true,
    postImage: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=100',
  },
  {
    id: '5',
    type: 'like',
    user: users[4],
    content: 'and 23 others liked your photo',
    timestamp: '5h ago',
    isRead: true,
    postImage: 'https://images.unsplash.com/photo-1682695796497-31a44224d6d6?w=100',
  },
  {
    id: '6',
    type: 'message',
    user: users[5],
    content: 'sent you a message',
    timestamp: '1d ago',
    isRead: true,
  },
];

export const reels: Reel[] = [
  {
    id: '1',
    user: users[0],
    videoUrl: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600',
    thumbnail: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600',
    caption: 'POV: You discovered the best sunset spot 🌅 #travel #sunset #vibes',
    likes: 45234,
    comments: 892,
    shares: 234,
    music: 'Blinding Lights - The Weeknd',
    isLiked: false,
  },
  {
    id: '2',
    user: users[1],
    videoUrl: 'https://images.unsplash.com/photo-1682686581498-5e85c7228119?w=600',
    thumbnail: 'https://images.unsplash.com/photo-1682686581498-5e85c7228119?w=600',
    caption: 'This view was unreal 😍 #nature #explore',
    likes: 32456,
    comments: 567,
    shares: 123,
    music: 'Heat Waves - Glass Animals',
    isLiked: true,
  },
  {
    id: '3',
    user: users[2],
    videoUrl: 'https://images.unsplash.com/photo-1682695797221-8164ff1fafc9?w=600',
    thumbnail: 'https://images.unsplash.com/photo-1682695797221-8164ff1fafc9?w=600',
    caption: 'Behind the scenes of my latest design 🎨',
    likes: 28934,
    comments: 423,
    shares: 89,
    music: 'Levitating - Dua Lipa',
    isLiked: false,
  },
];

export const trendingHashtags = [
  { tag: 'momentx', posts: 1234567 },
  { tag: 'photography', posts: 892345 },
  { tag: 'travel', posts: 756234 },
  { tag: 'design', posts: 543210 },
  { tag: 'art', posts: 432109 },
  { tag: 'nature', posts: 321098 },
  { tag: 'sunset', posts: 210987 },
  { tag: 'lifestyle', posts: 109876 },
];

export const suggestedUsers = users.filter(u => !['1', '2'].includes(u.id));

export const highlights = [
  { id: '1', name: 'Travel', cover: 'https://images.unsplash.com/photo-1682686581498-5e85c7228119?w=200' },
  { id: '2', name: 'Food', cover: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200' },
  { id: '3', name: 'Friends', cover: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200' },
  { id: '4', name: 'Art', cover: 'https://images.unsplash.com/photo-1682695797221-8164ff1fafc9?w=200' },
  { id: '5', name: '2024', cover: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=200' },
];

export const adminStats = {
  totalUsers: 1245678,
  activeUsers: 892345,
  totalPosts: 4567890,
  totalReels: 234567,
  newUsersToday: 1234,
  reportsToday: 45,
  revenue: 125678.90,
};

export const reportedPosts = [
  { id: '1', post: posts[0], reason: 'Inappropriate content', reportCount: 5, status: 'pending' },
  { id: '2', post: posts[1], reason: 'Spam', reportCount: 3, status: 'pending' },
  { id: '3', post: posts[2], reason: 'Copyright violation', reportCount: 8, status: 'reviewed' },
];

export const activityData = [
  { name: 'Mon', posts: 120, likes: 2400, comments: 800 },
  { name: 'Tue', posts: 150, likes: 3200, comments: 1100 },
  { name: 'Wed', posts: 180, likes: 2800, comments: 950 },
  { name: 'Thu', posts: 200, likes: 4500, comments: 1500 },
  { name: 'Fri', posts: 250, likes: 5200, comments: 1800 },
  { name: 'Sat', posts: 300, likes: 6100, comments: 2200 },
  { name: 'Sun', posts: 280, likes: 5800, comments: 2000 },
];
