import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText, PenTool, Users, UserPlus, Settings, LogOut, Wallet, PlusCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    metamaskConnected,
    metamaskPublicKey,
    connectMetaMaskWallet,
    disconnectMetaMaskWallet
  } = useWallet();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

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

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleConnectMetaMask = async () => {
    try {
      await connectMetaMaskWallet();
    } catch (error) {
      console.error('Failed to connect MetaMask:', error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Failed to connect MetaMask. Please try again.",
      });
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2.5 sticky top-0 z-50">
      <div className="flex flex-wrap justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img src="/SealTrack.png" className="h-8 mr-2" alt="SealTrack Logo" />
            <span className="text-xl font-semibold whitespace-nowrap text-sealtrack-primary">SealTrack</span>
          </Link>
          <div className="hidden md:flex space-x-2">
            <Link to="/documents">
              <Button variant={isActive('/documents') ? 'default' : 'ghost'} className="gap-2">
                <FileText className="w-4 h-4" />
                Documents
              </Button>
            </Link>
            <Link to="/templates">
              <Button variant={isActive('/templates') ? 'default' : 'ghost'} className="gap-2">
                <PenTool className="w-4 h-4" />
                Templates
              </Button>
            </Link>
            <Link to="/contacts">
              <Button variant={isActive('/contacts') ? 'default' : 'ghost'} className="gap-2">
                <Users className="w-4 h-4" />
                Contacts
              </Button>
            </Link>
            <Link to="/invitations">
              <Button variant={isActive('/invitations') ? 'default' : 'ghost'} className="gap-2">
                <UserPlus className="w-4 h-4" />
                Invitations
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <Button 
                variant="outline" 
                className="gap-2 hidden sm:flex" 
                onClick={() => navigate('/documents/create')}
              >
                <PlusCircle className="w-4 h-4" />
                New Document
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Wallet className="w-4 h-4" />
                    {metamaskConnected ? (
                      <span className="hidden sm:inline">Connected</span>
                    ) : (
                      <span className="hidden sm:inline">Connect Wallet</span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Wallet Connection</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* MetaMask Connection */}
                  {metamaskConnected ? (
                    <DropdownMenuItem onClick={() => disconnectMetaMaskWallet()}>
                      <img src="/metamask.svg" alt="MetaMask" className="w-4 h-4 mr-2" />
                      <span className="text-red-600">Disconnect MetaMask</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={handleConnectMetaMask}>
                      <img src="/metamask.svg" alt="MetaMask" className="w-4 h-4 mr-2" />
                      Connect MetaMask (Sepolia)
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
