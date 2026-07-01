"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BookOpen,
  School,
  DoorOpen,
  Coffee,
  FileBarChart,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Timetable", href: "/timetable", icon: CalendarDays },
  { name: "Teachers", href: "/teachers", icon: Users },
  { name: "Subjects", href: "/subjects", icon: BookOpen },
  { name: "Classes", href: "/classes", icon: School },
  { name: "Breaks", href: "/breaks", icon: Coffee },
  { name: "Reports", href: "/reports", icon: FileBarChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.div
      initial={false}
      animate={{ width: isExpanded ? 260 : 72 }}
      className="h-screen bg-sidebar border-r border-sidebar-border flex flex-col justify-between shrink-0 overflow-visible text-sidebar-foreground z-50 relative"
    >
      <div className="overflow-hidden h-full flex flex-col">
        <div className="h-16 flex items-center px-4 justify-between border-b border-sidebar-border shrink-0">
          {isExpanded && (
            <span className="font-heading font-bold text-2xl text-sidebar-primary tracking-wide ml-1">
              Skedio
            </span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors mx-auto text-sidebar-foreground/70"
          >
            {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-4">
          <nav className="px-3 space-y-1.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[14px] transition-all duration-200 group relative ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
                      : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <item.icon size={20} className={`shrink-0 ${isActive ? "" : "opacity-80"}`} />
                  {isExpanded && (
                    <span className="truncate text-[15px]">{item.name}</span>
                  )}
                  {!isExpanded && (
                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-foreground text-background text-sm rounded-[10px] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-lg z-50 transition-opacity">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* Profile Section */}
      <div className="p-4 border-t border-sidebar-border shrink-0 overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold shrink-0 shadow-sm">
            A
          </div>
          {isExpanded && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">Admin User</p>
              <p className="text-xs opacity-80 truncate">admin@skedio.app</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
