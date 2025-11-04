import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();

  const getUserInitials = () => {
    if (!user) return "U";
    if (user.name) {
      const names = user.name.split(' ');
      return names.length > 1
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-white">Profile</h1>
          <p className="text-white/70">Your account information and settings</p>
        </div>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">User Information</CardTitle>
            <CardDescription className="text-white/70">Your Firebase profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.picture || undefined} alt={user?.name || "User"} />
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-2xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">{user?.name || "User"}</h2>
                <p className="text-white/70">{user?.email}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-white">Debug Information</h3>
              <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm space-y-2">
                <div className="grid grid-cols-[150px_1fr] gap-2">
                  <span className="text-white/50">User ID:</span>
                  <span className="text-cyan-400">{user?.uid || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-2">
                  <span className="text-white/50">Email:</span>
                  <span className="text-cyan-400">{user?.email || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-2">
                  <span className="text-white/50">Name:</span>
                  <span className="text-cyan-400">{user?.name || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-2">
                  <span className="text-white/50">Picture URL:</span>
                  <span className="text-cyan-400 truncate">{user?.picture || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-white">Full User Object</h3>
              <div className="bg-gray-900/50 rounded-lg p-4 overflow-auto max-h-96">
                <pre className="text-xs text-cyan-400">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-700">
              <Button
                onClick={logout}
                variant="outline"
                className="bg-red-600/20 border-red-600/30 text-red-400 hover:bg-red-600/40 hover:border-red-500/50"
              >
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
