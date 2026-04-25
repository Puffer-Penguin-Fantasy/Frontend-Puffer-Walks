"use client";


import { 
  Home
} from "lucide-react";
import { cn } from "../lib/utils";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger,
} from "./ui/tooltip";
import { motion } from "framer-motion";

import { useLocation, useNavigate } from "react-router-dom";

// Simplified Dock implementation for the Puffer aesthetic
export function NavigationDock() {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === "/login") return null;

  const activeTab = location.pathname === "/" ? "home" : "";

  const navItems = [
    { id: "home", icon: Home, label: "Home", href: "/" },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000] px-4">
      <div className="flex items-center gap-1.5 p-1.5 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl">
        
        {/* Main Nav */}
        {navItems.map((item) => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate(item.href)}
                className={cn(
                  "relative p-2.5 rounded-full transition-all duration-300 group",
                  activeTab === item.id 
                    ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                )}
              >
                <item.icon size={18} />
                {activeTab === item.id && (
                  <motion.div 
                    layoutId="nav-glow"
                    className="absolute inset-0 rounded-full bg-blue-500/10 blur-md -z-10"
                  />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-[#161b22] border-white/10 text-white text-xs">
              {item.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
