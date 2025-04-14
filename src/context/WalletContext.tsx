import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
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
  isPhantom: boolean;
}

interface WalletContextType {
  wallet: PhantomProvider | null;
  connected: boolean;
  publicKey: string | null;
  connecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
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
  const [wallet, setWallet] = useState<PhantomProvider | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const provider = getPhantomProvider();
    setWallet(provider);

    if (provider) {
      // Try to connect if user was previously connected
      const checkConnection = async () => {
        try {
          const response = await provider.connect();
          setConnected(true);
          setPublicKey(response.publicKey.toString());
        } catch (error) {
          setConnected(false);
          setPublicKey(null);
        }
      };
      
      checkConnection();
      
      provider.on('connect', (publicKey: PublicKey) => {
        setConnected(true);
        setPublicKey(publicKey.toString());
      });
      
      provider.on('disconnect', () => {
        setConnected(false);
        setPublicKey(null);
      });
    }
  }, []);

  const connectWallet = async () => {
    if (!wallet) {
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
      setConnecting(true);
      const response = await wallet.connect();
      setConnected(true);
      setPublicKey(response.publicKey.toString());
      
      toast({
        title: "Wallet connected",
        description: "Your Phantom wallet has been successfully connected.",
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: "Failed to connect to your wallet. Please try again.",
      });
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    if (!wallet) return;

    try {
      await wallet.disconnect();
      setConnected(false);
      setPublicKey(null);
      
      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been disconnected.",
      });
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      toast({
        variant: "destructive",
        title: "Disconnection failed",
        description: "Failed to disconnect your wallet. Please try again.",
      });
    }
  };

  const signMessage = async (message: string) => {
    if (!wallet || !connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const encodedMessage = new TextEncoder().encode(message);
      const signedMessage = await wallet.signMessage(encodedMessage);
      
      const signature = Array.from(signedMessage.signature)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      toast({
        title: "Message signed",
        description: "Your message has been successfully signed.",
      });
      
      return signature;
    } catch (error) {
      console.error('Failed to sign message:', error);
      toast({
        variant: "destructive",
        title: "Signing failed",
        description: "Failed to sign the message. Please try again.",
      });
      throw error;
    }
  };

  const contextValue = useMemo(
    () => ({
      wallet,
      connected,
      publicKey,
      connecting,
      connectWallet,
      disconnectWallet,
      signMessage,
    }),
    [wallet, connected, publicKey, connecting]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};
