import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Building2 } from "lucide-react";
import { useState } from "react";
import { UserRole } from "./backend";
import { Sidebar } from "./components/Sidebar";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useUserProfile, useUserRole } from "./hooks/useQueries";
import { AdminDashboard } from "./pages/AdminDashboard";
import { LoginPage } from "./pages/LoginPage";
import { UserDashboard } from "./pages/UserDashboard";
import { WorkerDashboard } from "./pages/WorkerDashboard";

export default function App() {
  const { identity, clear, isInitializing } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const [activePage, setActivePage] = useState("dashboard");

  const isLoading = isInitializing || profileLoading || roleLoading;

  // Not authenticated
  if (!identity) {
    return (
      <>
        <LoginPage needsProfile={false} />
        <Toaster richColors />
      </>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl hero-gradient flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <p className="text-muted-foreground text-sm">Loading CityFix...</p>
          <div className="mt-4 space-y-2 w-48">
            <Skeleton className="h-2 rounded-full" />
            <Skeleton className="h-2 rounded-full w-3/4 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Need to create profile
  if (!profile) {
    return (
      <>
        <LoginPage needsProfile={true} />
        <Toaster richColors />
      </>
    );
  }

  const userName = profile.name || "User";
  const userRole = role ?? UserRole.user;

  const isWorker = profile.role === "worker";

  const handleNavigate = (page: string) => {
    setActivePage(page);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        role={isWorker ? ("worker" as unknown as UserRole) : userRole}
        activePage={activePage}
        onNavigate={handleNavigate}
        userName={userName}
        onLogout={clear}
      />

      <main className="flex-1 ml-60 min-h-screen">
        {/* Top header */}
        <header className="bg-card border-b border-border px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 card-shadow">
          <div className="text-sm text-muted-foreground">
            <span className="capitalize font-medium text-foreground">
              {activePage.replace("-", " ")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground leading-none">
                {userName}
              </p>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">
                {isWorker ? "Worker" : userRole}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full hero-gradient flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <div className="p-8">
          {isWorker ? (
            <WorkerDashboard userName={userName} activePage={activePage} />
          ) : userRole === UserRole.admin ? (
            <AdminDashboard
              userName={userName}
              activePage={activePage}
              onNavigate={handleNavigate}
            />
          ) : (
            <UserDashboard
              userName={userName}
              activePage={activePage}
              onNavigate={handleNavigate}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-border py-6 px-8 mt-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground mb-1">CityFix</p>
              <p>
                Municipal Complaint Management System for smart urban
                governance.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Quick Links</p>
              <ul className="space-y-1">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate("dashboard")}
                    className="hover:text-primary transition-colors"
                  >
                    Dashboard
                  </button>
                </li>
                {!isWorker && userRole !== UserRole.admin && (
                  <li>
                    <button
                      type="button"
                      onClick={() => handleNavigate("submit")}
                      className="hover:text-primary transition-colors"
                    >
                      Submit Complaint
                    </button>
                  </li>
                )}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Support</p>
              <p>For technical issues, contact your city's municipal office.</p>
            </div>
          </div>
        </footer>
      </main>

      <Toaster richColors position="top-right" />
    </div>
  );
}
