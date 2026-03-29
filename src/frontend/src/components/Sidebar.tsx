import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  UserCircle,
  Users,
  Wrench,
} from "lucide-react";
import { UserRole } from "../backend";

interface SidebarProps {
  role: UserRole;
  activePage: string;
  onNavigate: (page: string) => void;
  userName: string;
  onLogout: () => void;
}

const navItems = {
  [UserRole.admin]: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "complaints", label: "All Complaints", icon: ClipboardList },
    { id: "workers", label: "Workers", icon: Users },
  ],
  [UserRole.user]: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "my-complaints", label: "My Complaints", icon: FileText },
    { id: "submit", label: "New Complaint", icon: ClipboardList },
  ],
  [UserRole.guest]: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  ],
};

const workerItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "assigned", label: "Assigned Tasks", icon: Wrench },
];

export function Sidebar({
  role,
  activePage,
  onNavigate,
  userName,
  onLogout,
}: SidebarProps) {
  const items =
    role === ("worker" as unknown)
      ? workerItems
      : (navItems[role] ?? navItems[UserRole.guest]);

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-sidebar border-r border-sidebar-border flex flex-col z-30 card-shadow">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-xl hero-gradient flex items-center justify-center shadow-sm">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-lg text-foreground tracking-tight">
            CityFix
          </span>
          <p className="text-xs text-muted-foreground leading-none mt-0.5">
            Municipal Portal
          </p>
        </div>
      </div>

      {/* Nav items */}
      <nav
        className="flex-1 px-3 py-4 space-y-1"
        aria-label="Sidebar navigation"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-ocid={`nav.${item.id}.link`}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "w-4.5 h-4.5 flex-shrink-0",
                  isActive ? "text-primary" : "",
                )}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
            <UserCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {userName}
            </p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
        </div>
        <Button
          data-ocid="nav.logout.button"
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
