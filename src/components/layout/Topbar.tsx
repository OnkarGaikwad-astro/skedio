import { Search, Bell, LogOut, Menu } from "lucide-react";
import { logoutSchool } from "@/app/actions/auth";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-40 gap-4">
      <div className="flex items-center gap-2 md:gap-0 flex-1 max-w-md">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
        >
          <Menu size={24} />
        </button>
        <div className="relative group w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" size={18} />
          <input
            type="text"
            placeholder="Search..."
            className="w-full h-10 pl-10 pr-4 rounded-[14px] bg-card/60 border border-transparent focus:border-ring/30 focus:bg-background outline-none transition-all duration-300 text-sm placeholder:text-muted-foreground shadow-[0_2px_10px_rgba(0,0,0,0.02)] focus:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <button className="relative p-2 md:p-2.5 rounded-full hover:bg-card text-muted-foreground hover:text-foreground transition-colors shadow-sm bg-background border border-border/50">
          <Bell size={18} />
          <span className="absolute top-1 right-1 md:top-1.5 md:right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-background"></span>
        </button>
        <form action={logoutSchool}>
          <button type="submit" className="p-2 md:p-2.5 rounded-full hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors shadow-sm bg-background border border-border/50 flex items-center justify-center">
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </header>
  );
}
