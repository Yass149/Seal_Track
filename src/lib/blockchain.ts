import { ethers } from 'ethers';
import DocumentVerificationABI from '../contracts/DocumentVerification.json';

interface EthereumProvider {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on: (event: string, callback: (accounts: string[]) => void) => void;
    removeListener: (event: string, callback: (accounts: string[]) => void) => void;
    isMetaMask?: boolean;
    networkVersion?: string;
}

declare global {
    interface Window {
        ethereum: EthereumProvider;
    }
}

export class BlockchainService {
    private provider: ethers.providers.Web3Provider;
    private contract: ethers.Contract;
    private contractAddress: string;
    private MIN_ETH_BALANCE = ethers.utils.parseEther('0.01'); // Minimum 0.01 ETH required

    constructor() {
        if (!window.ethereum) {
            throw new Error('MetaMask not found. Please install MetaMask to use this application.');
        }

        if (!window.ethereum.isMetaMask) {
            throw new Error('Please use MetaMask as your wallet provider.');
        }

        // Initialize provider using window.ethereum
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        
        this.contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
        if (!this.contractAddress) {
            throw new Error('Contract address not found in environment variables');
        }

        this.contract = new ethers.Contract(
            this.contractAddress,
            DocumentVerificationABI.abi,
            this.provider
        );
    }

    async verifyContract(): Promise<boolean> {
        try {
            const code = await this.provider.getCode(this.contractAddress);
            return code !== '0x';
        } catch (error) {
            console.error('Error verifying contract:', error);
            return false;
        }
    }

    async connectWallet(): Promise<string> {
        try {
            // Check if we're on the correct network
            const network = await this.provider.getNetwork();
            if (network.chainId !== 11155111) { // Sepolia chain ID
                throw new Error('Please switch to Sepolia testnet in MetaMask');
            }

            // Request account access
            const accounts = await this.provider.send('eth_requestAccounts', []);
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found. Please unlock your MetaMask wallet.');
            }
            return accounts[0];
        } catch (error) {
            console.error('Error connecting wallet:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to connect wallet: ${error.message}`);
            }
            throw new Error('Failed to connect wallet: Unknown error');
        }
    }

    async checkBalance(): Promise<boolean> {
        try {
            const signer = this.provider.getSigner();
            const balance = await signer.getBalance();
            return balance.gte(this.MIN_ETH_BALANCE);
        } catch (error) {
            console.error('Error checking balance:', error);
            return false;
        }
    }

    async storeDocument(documentId: string, hash: string): Promise<boolean> {
        try {
            console.log('Starting document storage on blockchain:', { documentId, hash });
            
            // Verify contract exists
            const contractExists = await this.verifyContract();
            if (!contractExists) {
                console.error('Contract not found at address:', this.contractAddress);
                throw new Error('Contract not found at the specified address');
            }

            // Check balance before proceeding
            const hasBalance = await this.checkBalance();
            if (!hasBalance) {
                throw new Error('Insufficient ETH balance. You need at least 0.01 ETH for gas fees. Visit a Sepolia faucet to get test ETH.');
            }

            const signer = this.provider.getSigner();
            const contractWithSigner = this.contract.connect(signer);

            const documentIdBytes = ethers.utils.id(documentId);
            const hashBytes = ethers.utils.id(hash);
            
            console.log('Estimating gas for transaction...');
            // Estimate gas first
            const gasEstimate = await contractWithSigner.estimateGas.storeDocument(documentIdBytes, hashBytes);
            console.log('Gas estimate:', gasEstimate.toString());
            
            // Get gas price
            const gasPrice = await this.provider.getGasPrice();
            console.log('Current gas price:', ethers.utils.formatUnits(gasPrice, 'gwei'), 'gwei');
            
            // Check if user has enough ETH for this specific transaction
            const balance = await signer.getBalance();
            const requiredBalance = gasEstimate.mul(gasPrice);
            console.log('Required balance:', ethers.utils.formatEther(requiredBalance), 'ETH');
            console.log('Current balance:', ethers.utils.formatEther(balance), 'ETH');
            
            if (balance.lt(requiredBalance)) {
                throw new Error(`Insufficient ETH for gas fees. Required: ${ethers.utils.formatEther(requiredBalance)} ETH`);
            }
            
            console.log('Sending transaction...');
            const tx = await contractWithSigner.storeDocument(documentIdBytes, hashBytes);
            console.log('Transaction sent:', tx.hash);
            console.log('Waiting for confirmation...');
            
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt);
            
            if (receipt.status === 0) {
                throw new Error('Transaction failed');
            }
            
            console.log('Document successfully stored on blockchain');
            return true;
        } catch (error) {
            console.error('Error storing document:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to store document: ${error.message}`);
            }
            throw new Error('Failed to store document: Unknown error');
        }
    }

    async verifyDocument(documentId: string, hash: string): Promise<boolean> {
        try {
            // Verify contract exists
            const contractExists = await this.verifyContract();
            if (!contractExists) {
                throw new Error('Contract not found at the specified address');
            }

            const documentIdBytes = ethers.utils.id(documentId);
            const hashBytes = ethers.utils.id(hash);
            
            return await this.contract.verifyDocument(documentIdBytes, hashBytes);
        } catch (error) {
            console.error('Error verifying document:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to verify document: ${error.message}`);
            }
            throw new Error('Failed to verify document: Unknown error');
        }
    }

    async getDocument(documentId: string): Promise<{
        hash: string;
        creator: string;
        timestamp: number;
        exists: boolean;
    } | null> {
        try {
            // Verify contract exists
            const contractExists = await this.verifyContract();
            if (!contractExists) {
                throw new Error('Contract not found at the specified address');
            }

            const documentIdBytes = ethers.utils.id(documentId);
            const [hash, creator, timestamp, exists] = await this.contract.getDocument(documentIdBytes);
            
            return {
                hash: ethers.utils.hexlify(hash),
                creator,
                timestamp: timestamp.toNumber(),
                exists
            };
        } catch (error) {
            console.error('Error getting document:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to get document: ${error.message}`);
            }
            throw new Error('Failed to get document: Unknown error');
        }
    }
} 