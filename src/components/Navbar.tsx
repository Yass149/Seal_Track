
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText, PenTool, Users, UserPlus, Settings, LogOut, Wallet, PlusCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { connected, connectWallet, disconnectWallet, publicKey } = useWallet();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2.5 sticky top-0 z-50">
      <div className="flex flex-wrap justify-between items-center">
        <div className="flex items-center">
          <Link to="/documents" className="flex items-center mr-8">
            <svg
              className="w-8 h-8 mr-2 text-docuchain-primary"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              <path d="M6.75 5.25h10.5a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5H6.75a1.5 1.5 0 0 1-1.5-1.5V6.75a1.5 1.5 0 0 1 1.5-1.5Z" />
            </svg>
            <span className="text-xl font-semibold whitespace-nowrap text-docuchain-primary">DocuChain</span>
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
              
              {connected ? (
                <Button variant="outline" className="gap-2 text-green-600" onClick={disconnectWallet}>
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">Connected</span>
                  <span className="hidden sm:inline text-xs truncate max-w-[80px]">
                    {publicKey && publicKey.slice(0, 4) + '...' + publicKey.slice(-4)}
                  </span>
                </Button>
              ) : (
                <Button variant="outline" className="gap-2" onClick={connectWallet}>
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">Connect Wallet</span>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative rounded-full h-8 w-8 p-0">
                    <Avatar>
                      <AvatarImage src="" alt={user.name} />
                      <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
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
