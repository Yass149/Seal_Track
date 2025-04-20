import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface JsonRpcRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params?: unknown[];
}

interface EthereumProvider {
  request: (request: JsonRpcRequest) => Promise<unknown>;
  on: (event: string, callback: (accounts: string[]) => void) => void;
  removeListener: (event: string, callback: (accounts: string[]) => void) => void;
  isMetaMask?: boolean;
}

interface Window {
  ethereum?: EthereumProvider;
}

interface WalletContextType {
  metamaskConnected: boolean;
  metamaskPublicKey: string | null;
  connectMetaMaskWallet: () => Promise<void>;
  disconnectMetaMaskWallet: () => Promise<void>;
  signMessageWithMetaMask: (message: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [metamaskConnected, setMetamaskConnected] = useState(false);
  const [metamaskPublicKey, setMetamaskPublicKey] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    const ethereum = (window as unknown as Window).ethereum;
    return Boolean(ethereum && ethereum.isMetaMask);
  };

  // Handle MetaMask account changes
  const handleMetaMaskAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setMetamaskConnected(false);
      setMetamaskPublicKey(null);
    } else {
      setMetamaskConnected(true);
      setMetamaskPublicKey(accounts[0]);
    }
  };

  // Connect MetaMask wallet
  const connectMetaMaskWallet = async () => {
    try {
      if (!isMetaMaskInstalled()) {
        toast({
          variant: "destructive",
          title: "MetaMask Not Found",
          description: "Please install MetaMask to use this feature.",
        });
        return;
      }

      const provider = (window as unknown as Window).ethereum as EthereumProvider;
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
        jsonrpc: '2.0',
        id: 1,
      }) as string[];

      if (accounts.length > 0) {
        setMetamaskConnected(true);
        setMetamaskPublicKey(accounts[0]);
        toast({
          title: "Connected to MetaMask",
          description: "Successfully connected to MetaMask wallet.",
        });
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to MetaMask.",
      });
      throw error;
    }
  };

  // Disconnect MetaMask wallet
  const disconnectMetaMaskWallet = async () => {
    setMetamaskConnected(false);
    setMetamaskPublicKey(null);
    toast({
      title: "Disconnected from MetaMask",
      description: "Successfully disconnected from MetaMask wallet.",
    });
  };

  // Sign message with MetaMask
  const signMessageWithMetaMask = async (message: string): Promise<string> => {
    try {
      if (!metamaskConnected || !metamaskPublicKey) {
        throw new Error('MetaMask wallet not connected');
      }

      const provider = (window as unknown as Window).ethereum as EthereumProvider;
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, metamaskPublicKey],
        jsonrpc: '2.0',
        id: 1,
      }) as string;

      return signature;
    } catch (error) {
      console.error('Error signing message with MetaMask:', error);
      toast({
        variant: "destructive",
        title: "Signing Failed",
        description: error instanceof Error ? error.message : "Failed to sign message with MetaMask.",
      });
      throw error;
    }
  };

  // Set up MetaMask event listeners
  useEffect(() => {
    const provider = (window as unknown as Window).ethereum as EthereumProvider;
    
    if (provider) {
      provider.on('accountsChanged', handleMetaMaskAccountsChanged);
    }

    return () => {
      if (provider) {
        provider.removeListener('accountsChanged', handleMetaMaskAccountsChanged);
      }
    };
  }, []);

  const value: WalletContextType = {
    metamaskConnected,
    metamaskPublicKey,
    connectMetaMaskWallet,
    disconnectMetaMaskWallet,
    signMessageWithMetaMask,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
