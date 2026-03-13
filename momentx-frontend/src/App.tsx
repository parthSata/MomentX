import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AnimatedRoutes } from "./components/AnimatedRoutes";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext"; 
import { SocketProvider } from "@/context/SocketContext";
import { CallProvider } from "@/context/CallContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {/* ✅ Wrap AnimatedRoutes with AuthProvider INSIDE BrowserRouter */}
          <AuthProvider>
            <SocketProvider>
              <CallProvider>
                <AnimatedRoutes />
              </CallProvider>
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;