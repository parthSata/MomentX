import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Phone, Video, MoreVertical, Send, Image, Mic, Smile, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { Input } from "@/components/ui/input";

const chatData = {
  user: {
    name: "Sarah Design",
    username: "sarah_design",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    isOnline: true,
  },
  messages: [
    { id: 1, text: "Hey! Love your latest post 😍", sender: "them", time: "10:30 AM" },
    { id: 2, text: "Thank you so much! Took that one at sunset", sender: "me", time: "10:32 AM" },
    { id: 3, text: "The colors are absolutely stunning!", sender: "them", time: "10:33 AM" },
    { id: 4, text: "Where was that photo taken?", sender: "them", time: "10:33 AM" },
    { id: 5, text: "It was at Malibu beach, the golden hour was perfect", sender: "me", time: "10:35 AM" },
    { id: 6, text: "I need to visit there sometime! 🏖️", sender: "them", time: "10:36 AM" },
    { id: 7, text: "You should! I can show you the best spots", sender: "me", time: "10:38 AM" },
    { id: 8, text: "That sounds amazing! Can't wait to see the photos 📸", sender: "them", time: "10:40 AM" },
  ],
};

export default function ChatPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(chatData.messages);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim()) return;
    
    const newMessage = {
      id: messages.length + 1,
      text: message,
      sender: "me" as const,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages([...messages, newMessage]);
    setMessage("");
    
    // Simulate typing indicator
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: "That's awesome! 🎉",
        sender: "them" as const,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }, 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-strong p-4 flex items-center justify-between z-40"
      >
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/chat")}
            className="p-2 glass rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <AvatarRing src={chatData.user.avatar} isOnline={chatData.user.isOnline} size="sm" />
          <div>
            <h4 className="font-semibold">{chatData.user.name}</h4>
            <p className="text-xs text-green-400">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 glass rounded-full">
            <Phone className="w-5 h-5" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 glass rounded-full">
            <Video className="w-5 h-5" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 glass rounded-full">
            <MoreVertical className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] ${msg.sender === "me" ? "order-1" : "order-2"}`}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`p-3 rounded-2xl ${
                    msg.sender === "me"
                      ? "bg-gradient-primary text-white rounded-br-md"
                      : "glass rounded-bl-md"
                  }`}
                >
                  <p>{msg.text}</p>
                </motion.div>
                <p className={`text-xs text-muted-foreground mt-1 ${msg.sender === "me" ? "text-right" : "text-left"}`}>
                  {msg.time}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2"
            >
              <AvatarRing src={chatData.user.avatar} size="sm" />
              <div className="glass p-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                      className="w-2 h-2 bg-primary rounded-full"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-strong p-4"
      >
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 glass rounded-full">
            <Camera className="w-5 h-5 text-primary" />
          </motion.button>
          <div className="flex-1 relative">
            <Input
              variant="glass"
              placeholder="Message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              className="pr-20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                <Smile className="w-5 h-5 text-muted-foreground" />
              </button>
              <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                <Image className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={sendMessage}
            className="p-3 bg-gradient-primary rounded-full"
          >
            {message ? <Send className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
