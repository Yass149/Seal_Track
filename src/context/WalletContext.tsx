import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { ethers } from 'ethers';

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

interface ExternalProvider {
  isMetaMask?: boolean;
  isStatus?: boolean;
  host?: string;
  path?: string;
  sendAsync?: (request: { method: string, params?: Array<unknown> }, callback: (error: unknown, response: unknown) => void) => void
  send?: (request: { method: string, params?: Array<unknown> }, callback: (error: unknown, response: unknown) => void) => void
  request?: (request: { method: string, params?: Array<unknown> }) => Promise<unknown>
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

  // Define a type for potential MetaMask errors with a code property
  type MetaMaskError = {
    code?: number;
    message?: string;
  };

  // Sign message with MetaMask
  const signMessageWithMetaMask = async (message: string): Promise<string> => {
    console.log('[signMessageWithMetaMask] Attempting to sign message:', message);
    if (!metamaskConnected || !metamaskPublicKey) {
      console.error('[signMessageWithMetaMask] Error: MetaMask wallet not connected.');
      throw new Error('MetaMask wallet not connected. Please connect your wallet.');
    }

    try {
      // 1. Get the provider using ethers.providers.Web3Provider
      const ethProvider = (window as unknown as Window).ethereum;
      if (!ethProvider) {
        console.error('[signMessageWithMetaMask] Error: MetaMask ethereum provider not found on window.');
        throw new Error('MetaMask is not installed or not detected.');
      }
      
      // --- Log the raw provider object --- 
      console.log('[signMessageWithMetaMask] Raw window.ethereum object:', ethProvider);
      // --- End Log ---
      
      // Cast to ExternalProvider for Web3Provider constructor
      const provider = new ethers.providers.Web3Provider(ethProvider as ExternalProvider);
      
      // 2. Get the signer
      const signer = await provider.getSigner();
      if (!signer) {
        console.error('[signMessageWithMetaMask] Error: Could not get signer from provider.');
        throw new Error('Could not get signer from MetaMask. Ensure your wallet is unlocked and connected.');
      }

      // --- Verify signer address --- 
      try {
          const signerAddress = await signer.getAddress();
          console.log('[signMessageWithMetaMask] Successfully obtained signer address:', signerAddress);
          if(signerAddress.toLowerCase() !== metamaskPublicKey.toLowerCase()) {
              console.warn('[signMessageWithMetaMask] Signer address mismatch! Expected:', metamaskPublicKey, 'Got:', signerAddress);
              // Decide if this is a critical error or just a warning
              // throw new Error('MetaMask signer address does not match connected account.');
          }
      } catch (addrError) {
          console.error('[signMessageWithMetaMask] Error getting signer address:', addrError);
          throw new Error('Could not confirm signer address from MetaMask.');
      }
      // --- End Verify --- 

      console.log('[signMessageWithMetaMask] Signer obtained and address verified, requesting signature...');

      // 3. Sign the message using the signer object
      try {
        const signature = await signer.signMessage(message);
        console.log('[signMessageWithMetaMask] Signature obtained:', signature);
        if (!signature) { // Add check for empty signature
          throw new Error('MetaMask returned an empty signature.');
        }
        return signature;
      } catch (signError) {
        // Log the raw error first to see its structure
        console.error('[signMessageWithMetaMask] Raw signing error object:', signError);
        // Log stringified version for potentially more detail
        try {
          console.error('[signMessageWithMetaMask] Raw signing error (stringified):', JSON.stringify(signError, null, 2));
        } catch (e) {
          console.error('[signMessageWithMetaMask] Could not stringify signing error.');
        }
        
        console.error('[signMessageWithMetaMask] Error during signer.signMessage:', signError);
        // Use the defined type for checking the error code
        if ((signError as MetaMaskError)?.code === 4001) { 
          throw new Error('MetaMask signature request rejected by user.');
        } else {
          // Use the message from the typed error if available
          throw new Error(`MetaMask signing failed: ${(signError as MetaMaskError)?.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('[signMessageWithMetaMask] General error:', error);
      // Re-throw the specific error caught or a generic one
      toast({ // Add toast feedback for general errors too
        variant: "destructive",
        title: "Wallet Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred with your wallet.",
      });
      throw error instanceof Error ? error : new Error('Failed to sign message with MetaMask');
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
