import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSaveProfile } from "../hooks/useQueries";

interface LoginPageProps {
  needsProfile: boolean;
}

export function LoginPage({ needsProfile }: LoginPageProps) {
  const { login, isLoggingIn, isLoginError, identity } = useInternetIdentity();
  const saveProfile = useSaveProfile();
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.user);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    try {
      await saveProfile.mutateAsync({ name: name.trim(), role });
      toast.success("Profile saved! Welcome to CityFix.");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  if (needsProfile && identity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl hero-gradient flex items-center justify-center shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">CityFix</h1>
                <p className="text-sm text-muted-foreground">
                  Municipal Complaint Portal
                </p>
              </div>
            </div>
          </div>

          <Card className="card-shadow border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Complete Your Profile</CardTitle>
              <CardDescription>
                Tell us who you are to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    data-ocid="profile.input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>I am a...</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([UserRole.user, UserRole.admin] as UserRole[]).map(
                      (r) => (
                        <button
                          key={r}
                          type="button"
                          data-ocid={`profile.${r}.toggle`}
                          onClick={() => setRole(r)}
                          className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all capitalize ${
                            role === r
                              ? "bg-primary/10 border-primary text-primary"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {r === UserRole.user ? "Citizen" : "Admin"}
                        </button>
                      ),
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Workers are added by admins
                  </p>
                </div>

                <Button
                  type="submit"
                  data-ocid="profile.submit_button"
                  disabled={saveProfile.isPending}
                  className="w-full"
                >
                  {saveProfile.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Get Started →"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - hero */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient flex-col justify-center items-center p-12 text-white">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">CityFix</h1>
          <p className="text-xl font-medium mb-3 text-white/90">
            Municipal Complaint Management
          </p>
          <p className="text-white/75 text-base leading-relaxed">
            Report civic issues, track resolutions, and keep your city running
            smoothly. Water leakage, road damage, garbage — we handle it all.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { label: "Fast", desc: "Quick resolution" },
              { label: "Tracked", desc: "Real-time status" },
              { label: "Online", desc: "Paperless process" },
            ].map((f) => (
              <div
                key={f.label}
                className="bg-white/20 rounded-xl p-3 backdrop-blur-sm"
              >
                <CheckCircle className="w-5 h-5 text-white mx-auto mb-1" />
                <p className="font-semibold text-sm">{f.label}</p>
                <p className="text-white/70 text-xs">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - login */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl hero-gradient flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">CityFix</h1>
          </div>

          <Card className="card-shadow border-border">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to report and track municipal complaints in your city.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                data-ocid="login.primary_button"
                onClick={() => login()}
                disabled={isLoggingIn}
                className="w-full h-11 text-base font-semibold"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Sign in with Internet Identity"
                )}
              </Button>

              {isLoginError && (
                <p
                  data-ocid="login.error_state"
                  className="text-sm text-destructive text-center"
                >
                  Login failed. Please try again.
                </p>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs text-muted-foreground bg-card px-2">
                  Secure & Decentralized
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                CityFix uses Internet Identity for secure, anonymous
                authentication. No passwords required.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
