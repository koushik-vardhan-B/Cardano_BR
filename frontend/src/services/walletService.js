/**
 * VisionChain Cardano Wallet Service
 * Handles wallet connection, transactions, and VISION token interactions
 */

class CardanoWalletService {
    constructor() {
        this.wallet = null;
        this.walletName = null;
        this.address = null;
        this.balance = null;
    }

    /**
     * Get list of available Cardano wallets
     */
    async getAvailableWallets() {
        const wallets = [];

        if (window.cardano) {
            // Check for Nami (most popular for dApps)
            if (window.cardano.nami) {
                wallets.push({ name: 'nami', displayName: 'Nami', icon: '🦎' });
            }

            // Check for Lace (Nami's successor)
            if (window.cardano.lace) {
                wallets.push({ name: 'lace', displayName: 'Lace', icon: '🎴' });
            }

            // Check for Flint
            if (window.cardano.flint) {
                wallets.push({ name: 'flint', displayName: 'Flint', icon: '🔥' });
            }

            // Check for Eternl (requires full setup)
            if (window.cardano.eternl) {
                try {
                    // Test if Eternl is properly configured
                    const isEnabled = await window.cardano.eternl.isEnabled();
                    if (isEnabled) {
                        wallets.push({ name: 'eternl', displayName: 'Eternl', icon: '♾️' });
                    }
                } catch (e) {
                    // Eternl not properly configured, skip it
                    console.log('Eternl detected but not configured for dApps');
                }
            }

            // Check for Typhon
            if (window.cardano.typhon) {
                wallets.push({ name: 'typhon', displayName: 'Typhon', icon: '🌊' });
            }
        }

        return wallets;
    }

    /**
     * Connect to a Cardano wallet
     */
    async connect(walletName = 'nami') {
        try {
            if (!window.cardano || !window.cardano[walletName]) {
                throw new Error(`${walletName} wallet not found. Please install it first.`);
            }

            // Enable the wallet
            this.wallet = await window.cardano[walletName].enable();
            this.walletName = walletName;

            // Get wallet address in Bech32 format
            try {
                // Try to get used addresses (returns Bech32 format)
                const usedAddresses = await this.wallet.getUsedAddresses();
                if (usedAddresses && usedAddresses.length > 0) {
                    // Addresses are returned as hex, need to decode
                    this.address = usedAddresses[0];
                } else {
                    // Fallback to change address
                    const changeAddress = await this.wallet.getChangeAddress();
                    this.address = changeAddress;
                }

                // If address is in hex format, try to get the Bech32 version
                if (this.address && !this.address.startsWith('addr')) {
                    // For display purposes, we'll use the hex address
                    // In production, you'd decode this to Bech32
                    console.log('Address in hex format:', this.address);
                }
            } catch (addrError) {
                console.error('Address fetch error:', addrError);
                // Fallback: use a shortened version of the hex
                const changeAddr = await this.wallet.getChangeAddress();
                this.address = changeAddr;
            }

            // Get balance
            await this.updateBalance();

            return {
                success: true,
                wallet: walletName,
                address: this.address,
                balance: this.balance
            };
        } catch (error) {
            console.error('Wallet connection error:', error);
            throw new Error(`Failed to connect to ${walletName}: ${error.message}`);
        }
    }

    /**
     * Disconnect wallet
     */
    disconnect() {
        this.wallet = null;
        this.walletName = null;
        this.address = null;
        this.balance = null;
    }

    /**
     * Update wallet balance
     */
    async updateBalance() {
        if (!this.wallet) {
            throw new Error('Wallet not connected');
        }

        try {
            const balanceHex = await this.wallet.getBalance();
            // Convert hex to lovelace (1 ADA = 1,000,000 lovelace)
            const lovelace = parseInt(balanceHex, 16);
            this.balance = {
                ada: (lovelace / 1000000).toFixed(2),
                lovelace: lovelace
            };

            return this.balance;
        } catch (error) {
            console.error('Balance update error:', error);
            return { ada: '0.00', lovelace: 0 };
        }
    }

    /**
     * Get wallet info
     */
    getWalletInfo() {
        return {
            connected: !!this.wallet,
            walletName: this.walletName,
            address: this.address,
            balance: this.balance
        };
    }

    /**
     * Check if wallet is connected
     */
    isConnected() {
        return !!this.wallet;
    }

    /**
     * Get network ID
     */
    async getNetworkId() {
        if (!this.wallet) {
            throw new Error('Wallet not connected');
        }

        try {
            const networkId = await this.wallet.getNetworkId();
            // 0 = testnet, 1 = mainnet
            return networkId === 0 ? 'testnet' : 'mainnet';
        } catch (error) {
            console.error('Network ID error:', error);
            return 'unknown';
        }
    }

    /**
     * Get formatted address for display
     * Cardano wallets return hex format, this makes it more readable
     */
    getFormattedAddress() {
        if (!this.address) return '';

        // If it's already in Bech32 format (starts with addr_)
        if (this.address.startsWith('addr')) {
            return this.address;
        }

        // For hex addresses, show a shortened version with explanation
        const short = `${this.address.slice(0, 12)}...${this.address.slice(-8)}`;
        return short;
    }

    /**
     * Get full address (for copying)
     */
    getFullAddress() {
        return this.address || '';
    }
}

// Create singleton instance
const walletService = new CardanoWalletService();

export default walletService;
