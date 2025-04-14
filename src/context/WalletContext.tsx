import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { ethers } from 'ethers';
import { useToast } from "@/components/ui/use-toast";

export interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: string, handler: (args: unknown) => void) => void;
  removeListener: (event: string, handler: (args: unknown) => void) => void;
  isPhantom?: boolean;
}

interface WalletContextType {
  // Phantom wallet for signatures
  phantomWallet: PhantomProvider | null;
  phantomConnected: boolean;
  phantomPublicKey: string | null;
  phantomConnecting: boolean;
  connectPhantomWallet: () => Promise<void>;
  disconnectPhantomWallet: () => Promise<void>;
  signWithPhantom: (message: string) => Promise<string>;

  // MetaMask wallet for document verification
  metamaskConnected: boolean;
  metamaskPublicKey: string | null;
  metamaskConnecting: boolean;
  connectMetaMaskWallet: () => Promise<void>;
  disconnectMetaMaskWallet: () => Promise<void>;
  signWithMetaMask: (message: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Utility function to detect if Phantom is installed
const getPhantomProvider = (): PhantomProvider | null => {
  if ('phantom' in window) {
    const provider = (window as { phantom?: { solana?: PhantomProvider } })?.phantom?.solana;
    if (provider?.isPhantom) {
      return provider;
    }
  }
  return null;
};

// Check if the current domain is allowed by Phantom
const isAllowedDomain = () => {
  const currentDomain = window.location.hostname;
  return currentDomain === 'localhost' || currentDomain === '127.0.0.1';
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phantomWallet, setPhantomWallet] = useState<PhantomProvider | null>(null);
  const [phantomConnected, setPhantomConnected] = useState<boolean>(false);
  const [phantomPublicKey, setPhantomPublicKey] = useState<string | null>(null);
  const [phantomConnecting, setPhantomConnecting] = useState<boolean>(false);

  const [metamaskConnected, setMetamaskConnected] = useState<boolean>(false);
  const [metamaskPublicKey, setMetamaskPublicKey] = useState<string | null>(null);
  const [metamaskConnecting, setMetamaskConnecting] = useState<boolean>(false);

  const { toast } = useToast();

  // Initialize Phantom wallet
  useEffect(() => {
    const provider = getPhantomProvider();
    setPhantomWallet(provider);

    if (provider) {
      const checkConnection = async () => {
        try {
          const response = await provider.connect();
          setPhantomConnected(true);
          setPhantomPublicKey(response.publicKey.toString());
        } catch (error) {
          setPhantomConnected(false);
          setPhantomPublicKey(null);
        }
      };
      
      checkConnection();
      
      provider.on('connect', (publicKey: PublicKey) => {
        setPhantomConnected(true);
        setPhantomPublicKey(publicKey.toString());
      });
      
      provider.on('disconnect', () => {
        setPhantomConnected(false);
        setPhantomPublicKey(null);
      });
    }
  }, []);

  // Initialize MetaMask wallet
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setMetamaskConnected(false);
          setMetamaskPublicKey(null);
        } else {
          setMetamaskConnected(true);
          setMetamaskPublicKey(accounts[0]);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  const connectPhantomWallet = async () => {
    if (!phantomWallet) {
      toast({
        variant: "destructive",
        title: "Phantom Wallet not found",
        description: "Please install the Phantom Wallet extension and refresh the page.",
      });
      window.open('https://phantom.app/', '_blank');
      return;
    }

    if (!isAllowedDomain()) {
      toast({
        variant: "destructive",
        title: "Domain not allowed",
        description: "Phantom wallet can only connect to localhost. Please access the app through localhost:8080",
      });
      return;
    }

    try {
      setPhantomConnecting(true);
      const response = await phantomWallet.connect();
      if (!response || !response.publicKey) {
        throw new Error('Failed to connect to Phantom wallet');
      }
      setPhantomConnected(true);
      setPhantomPublicKey(response.publicKey.toString());
      
      toast({
        title: "Phantom Wallet connected",
        description: "Your Phantom wallet has been successfully connected.",
      });
    } catch (error) {
      console.error('Failed to connect Phantom wallet:', error);
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to your Phantom wallet. Please try again.",
      });
    } finally {
      setPhantomConnecting(false);
    }
  };

  const connectMetaMaskWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask to use this feature",
        variant: "destructive"
      });
      return;
    }

    try {
      setMetamaskConnecting(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts.length > 0) {
        setMetamaskConnected(true);
        setMetamaskPublicKey(accounts[0]);
        toast({
          title: "MetaMask Connected",
          description: "Successfully connected to MetaMask"
        });
      }
    } catch (error) {
      console.error('Error connecting MetaMask:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect MetaMask",
        variant: "destructive"
      });
    } finally {
      setMetamaskConnecting(false);
    }
  };

  const disconnectPhantomWallet = async () => {
    if (!phantomWallet) return;

    try {
      await phantomWallet.disconnect();
      setPhantomConnected(false);
      setPhantomPublicKey(null);
      
      toast({
        title: "Phantom Wallet disconnected",
        description: "Your Phantom wallet has been disconnected.",
      });
    } catch (error) {
      console.error('Failed to disconnect Phantom wallet:', error);
      toast({
        variant: "destructive",
        title: "Disconnection failed",
        description: "Failed to disconnect your Phantom wallet. Please try again.",
      });
    }
  };

  const disconnectMetaMaskWallet = async () => {
    setMetamaskConnected(false);
    setMetamaskPublicKey(null);
    toast({
      title: "MetaMask Disconnected",
      description: "Successfully disconnected MetaMask"
    });
  };

  const signWithPhantom = async (message: string) => {
    if (!phantomWallet || !phantomConnected) {
      throw new Error('Phantom wallet not connected');
    }

    try {
      const encodedMessage = new TextEncoder().encode(message);
      const signedMessage = await phantomWallet.signMessage(encodedMessage);
      
      const signature = Array.from(signedMessage.signature)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      toast({
        title: "Message signed with Phantom",
        description: "Your message has been successfully signed.",
      });
      
      return signature;
    } catch (error) {
      console.error('Failed to sign message with Phantom:', error);
      toast({
        variant: "destructive",
        title: "Signing failed",
        description: "Failed to sign the message with Phantom. Please try again.",
      });
      throw error;
    }
  };

  const signWithMetaMask = async (message: string): Promise<string> => {
    if (!metamaskConnected || !metamaskPublicKey) {
      throw new Error('MetaMask not connected');
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const signature = await signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Error signing with MetaMask:', error);
      throw error;
    }
  };

  const contextValue = useMemo(
    () => ({
      phantomWallet,
      phantomConnected,
      phantomPublicKey,
      phantomConnecting,
      connectPhantomWallet,
      disconnectPhantomWallet,
      signWithPhantom,
      metamaskConnected,
      metamaskPublicKey,
      metamaskConnecting,
      connectMetaMaskWallet,
      disconnectMetaMaskWallet,
      signWithMetaMask,
    }),
    [
      phantomWallet,
      phantomConnected,
      phantomPublicKey,
      phantomConnecting,
      metamaskConnected,
      metamaskPublicKey,
      metamaskConnecting,
    ]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};
