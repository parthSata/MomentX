import { Outlet, useLocation } from "react-router-dom";
import ChatSidebar from "./ChatSidebar";
import ChatRail from "./ChatRail";


export default function ChatLayout() {
   const location = useLocation();
   // Match both individual chat and group chat paths
   const isChatOpen = Boolean(
      location.pathname.match(/^\/chat\/[a-f0-9]{24}$/i) || // MongoDB ObjectId pattern
      location.pathname.includes("/group-chat/") || 
      (location.pathname.startsWith("/chat/") && location.pathname.length > 6)
   );

   return (
      <div className="flex h-[100dvh] w-full bg-background overflow-hidden text-foreground">
         {/* Rail: Far left icon navigation for desktop */}
         <div className="hidden md:flex flex-shrink-0">
            <ChatRail />
         </div>

         {/* Sidebar: Visible on desktop, hidden on mobile if a chat conversation is open */}
         <div className={`w-full md:w-[380px] lg:w-[420px] flex-shrink-0 border-r border-border ${isChatOpen ? "hidden md:flex" : "flex"} flex-col h-full bg-background relative z-10`}>
            <ChatSidebar />
         </div>

         {/* Main Chat Area (Outlet): Full screen on mobile if chat open, hidden on mobile otherwise */}
         <div className={`flex-1 ${!isChatOpen ? "hidden md:flex" : "flex"} h-full relative z-0 bg-background`}>
            <Outlet />
         </div>
      </div>
   );
}
