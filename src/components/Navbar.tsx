import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText, PenTool, Users, UserPlus, Settings, LogOut, Wallet, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';
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
                  <Button 
                    variant={metamaskConnected ? "default" : "outline"} 
                    className={cn(
                      "gap-2 transition-all duration-200",
                      metamaskConnected && "bg-green-600 hover:bg-green-700 text-white"
                    )}
                  >
                    <Wallet className="w-4 h-4" />
                    {metamaskConnected ? (
                      <span className="hidden sm:inline">
                        {metamaskPublicKey?.slice(0, 6)}...{metamaskPublicKey?.slice(-4)}
                      </span>
                    ) : (
                      <span className="hidden sm:inline">Connect Wallet</span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72">
                  <DropdownMenuLabel className="flex items-center gap-2 text-base">
                    <Wallet className="w-4 h-4 text-primary-600" />
                    Wallet Connection
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* MetaMask Connection */}
                  {metamaskConnected ? (
                    <>
                      <div className="px-2 py-3">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">Connected to MetaMask</span>
                        </div>
                        <div className="px-2 py-1.5 bg-muted/50 rounded-md">
                          <p className="text-xs font-mono text-muted-foreground break-all">
                            {metamaskPublicKey}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => disconnectMetaMaskWallet()}
                        className="gap-2 text-red-600 focus:text-red-600"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Disconnect Wallet
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <div className="p-2">
                      <Button 
                        onClick={handleConnectMetaMask}
                        className="w-full gap-2 bg-primary-600 hover:bg-primary-700"
                      >
                        <img 
                          src="/metamask.svg" 
                          alt="MetaMask" 
                          className="w-5 h-5" 
                          style={{ filter: 'brightness(0) invert(1)' }}
                        />
                        Connect MetaMask (Sepolia)
                      </Button>
                      <p className="mt-2 text-xs text-muted-foreground text-center">
                        Connect your wallet to sign and verify documents on the blockchain
                      </p>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.name || user.email} />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.user_metadata?.name || user.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
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
