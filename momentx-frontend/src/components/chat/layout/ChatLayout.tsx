import { Outlet, useLocation } from "react-router-dom";
import ChatSidebar from "./ChatSidebar";
import ChatRail from "./ChatRail";


export default function ChatLayout() {
   const location = useLocation();
   const isChatOpen = location.pathname.match(/\/chat\/[a-zA-Z0-9]+/) || location.pathname.includes("/group-chat/");

   return (
      <div className="flex h-[100dvh] w-full bg-background overflow-hidden text-foreground">
         {/* Rail: Far left icon navigation */}
         <div className="hidden md:flex">
            <ChatRail />
         </div>

         {/* Sidebar: Hidden on mobile if a chat is open */}
         <div className={`w-full md:w-[380px] lg:w-[420px] flex-shrink-0 border-r border-border ${isChatOpen ? "hidden md:flex" : "flex"} flex-col h-full bg-background`}>
            <ChatSidebar />
         </div>

         {/* Main Chat Area: Hidden on mobile if NO chat is open */}
         <div className={`flex-1 ${!isChatOpen ? "hidden md:flex" : "flex"} h-full relative`}>
            <Outlet />
         </div>
      </div>
   );
}
