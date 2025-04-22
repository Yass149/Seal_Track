import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, User, Wallet as WalletIcon, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const { metamaskPublicKey } = useWallet();
  const { toast } = useToast();

  // Get user's initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "U";
    const metadata = user.user_metadata;
    const name = metadata?.name || metadata?.full_name || user.email || "";
    if (name) {
      return name.split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email ? user.email.substring(0, 2).toUpperCase() : "U";
  };
  
  const handleCopyAddress = () => {
    if (metamaskPublicKey) {
      navigator.clipboard.writeText(metamaskPublicKey);
      toast({
        title: "Address Copied",
        description: "MetaMask wallet address copied to clipboard.",
      });
    }
  };

  if (!user) {
    // Optional: Redirect to login or show a message if user is not logged in
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p>Please log in to view settings.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile Card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <User className="h-5 w-5" /> User Profile
              </CardTitle>
              <CardDescription>Manage your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.name || user.email} />
                  <AvatarFallback className="text-xl">{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">
                    {user.user_metadata?.name || user.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              {/* Placeholder for editing profile - could be a dialog */}
              {/* <Button variant="outline" disabled>Edit Profile</Button> */}
            </CardContent>
          </Card>

          {/* Wallet Card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <WalletIcon className="h-5 w-5" /> Wallet Information
              </CardTitle>
              <CardDescription>Your connected blockchain wallet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {metamaskPublicKey ? (
                <div>
                  <p className="text-sm font-medium mb-1">Connected MetaMask Address:</p>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md border">
                    <span className="text-sm font-mono break-all mr-2">
                      {metamaskPublicKey}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleCopyAddress}
                      aria-label="Copy address"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No wallet connected. Connect your wallet via the Navbar.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Logout Button */}
        <div className="mt-12 pt-8 border-t">
          <Button 
            variant="destructive" 
            onClick={logout} 
            className="gap-2"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsPage; 