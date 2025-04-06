"use client"

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Icons } from "@/components/ui/icons"
import { QRCodeSVG } from 'qrcode.react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion } from "framer-motion"
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet?: {
    id: string;
    currency: string;
    balance: string;
  } | null;
}

// Networks available for each currency
const NETWORKS_BY_CURRENCY: Record<string, Array<{
  id: string;
  name: string;
  isRecommended?: boolean;
  fee?: string;
  isFiat?: boolean;
}>> = {
  btc: [{ id: 'btc', name: 'Bitcoin Network', isRecommended: true }],
  eth: [
    { id: 'erc20', name: 'Ethereum Network (ERC20)', isRecommended: true },
    { id: 'ethereum', name: 'Ethereum Network', fee: '10-20 USDT' }
  ],
  usdt: [
    { id: 'trc20', name: 'TRC20', isRecommended: true, fee: '1 USDT' },
    { id: 'erc20', name: 'ERC20', fee: '10-20 USDT' },
    { id: 'bep20', name: 'BEP20 (BSC)', fee: '0.5-1 USDT' }
  ],
  usdc: [
    { id: 'erc20', name: 'ERC20', isRecommended: true },
    { id: 'bep20', name: 'BEP20 (BSC)' }
  ],
  bnb: [{ id: 'bep20', name: 'BEP20 (BSC)', isRecommended: true }],
  matic: [{ id: 'polygon', name: 'Polygon Network', isRecommended: true }],
  sol: [{ id: 'solana', name: 'Solana Network', isRecommended: true }],
  dot: [{ id: 'polkadot', name: 'Polkadot Network', isRecommended: true }],
  ada: [{ id: 'cardano', name: 'Cardano Network', isRecommended: true }],
  xrp: [{ id: 'ripple', name: 'XRP Network', isRecommended: true }],
  doge: [{ id: 'dogecoin', name: 'Dogecoin Network', isRecommended: true }],
  link: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  aave: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  uni: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  cake: [{ id: 'bep20', name: 'BEP20 (BSC)', isRecommended: true }],
  shib: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  xlm: [{ id: 'stellar', name: 'Stellar Network', isRecommended: true }],
  fil: [{ id: 'filecoin', name: 'Filecoin Network', isRecommended: true }],
  axs: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  one: [{ id: 'harmony', name: 'Harmony Network', isRecommended: true }],
  xtz: [{ id: 'tezos', name: 'Tezos Network', isRecommended: true }],
  slp: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  sushi: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  zil: [{ id: 'zilliqa', name: 'Zilliqa Network', isRecommended: true }],
  floki: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  mana: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  sand: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  ape: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  enj: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  lrc: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  cfx: [{ id: 'conflux', name: 'Conflux Network', isRecommended: true }],
  wld: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  pepe: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  meme: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  bonk: [{ id: 'sol', name: 'Solana Network', isRecommended: true }],
  sui: [{ id: 'sui', name: 'Sui Network', isRecommended: true }],
  ordi: [{ id: 'btc', name: 'Bitcoin Network', isRecommended: true }],
  ens: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  algo: [{ id: 'algorand', name: 'Algorand Network', isRecommended: true }],
  arb: [{ id: 'arbitrum', name: 'Arbitrum Network', isRecommended: true }],
  wif: [{ id: 'btc', name: 'Bitcoin Network', isRecommended: true }],
  myro: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  nos: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  jup: [{ id: 'sol', name: 'Solana Network', isRecommended: true }],
  blur: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  kata: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  coq: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  wassie: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  fet: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  near: [{ id: 'near', name: 'NEAR Protocol', isRecommended: true }],
  ai: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  bob: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  slerf: [{ id: 'sol', name: 'Solana Network', isRecommended: true }],
  bome: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  stx: [{ id: 'stacks', name: 'Stacks Network', isRecommended: true }],
  ton: [{ id: 'ton', name: 'TON Network', isRecommended: true }],
  rndr: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  mog: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  inj: [{ id: 'injective', name: 'Injective Network', isRecommended: true }],
  mnt: [{ id: 'mantle', name: 'Mantle Network', isRecommended: true }],
  beam: [{ id: 'beam', name: 'Beam Network', isRecommended: true }],
  strk: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  nochill: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  mew: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  gno: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  waves: [{ id: 'waves', name: 'Waves Network', isRecommended: true }],
  xyo: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  trump: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  fartcoin: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  pnut: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  hype: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  ngn: [{ id: 'bank', name: 'Bank Transfer', isRecommended: true }],
  usd: [{ id: 'bank', name: 'Bank Transfer', isRecommended: true }]
};

// Add this helper function
const getCurrencyName = (currency: string): string => {
  const names: Record<string, string> = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    USDT: 'Tether',
    USDC: 'USD Coin',
    BNB: 'Binance Coin',
    MATIC: 'Polygon',
    SOL: 'Solana',
    DOT: 'Polkadot',
    ADA: 'Cardano',
    XRP: 'Ripple',
    DOGE: 'Dogecoin',
    LINK: 'Chainlink',
    AAVE: 'Aave',
    UNI: 'Uniswap',
    CAKE: 'PancakeSwap',
    SHIB: 'Shiba Inu',
    XLM: 'Stellar',
    FIL: 'Filecoin',
    AXS: 'Axie Infinity',
    ONE: 'Harmony',
    XTZ: 'Tezos',
    SLP: 'Smooth Love Potion',
    SUSHI: 'SushiSwap',
    ZIL: 'Zilliqa',
    FLOKI: 'Floki Inu',
    MANA: 'Decentraland',
    SAND: 'The Sandbox',
    APE: 'ApeCoin',
    ENJ: 'Enjin Coin',
    LRC: 'Loopring',
    CFX: 'Conflux',
    WLD: 'Worldcoin',
    PEPE: 'Pepe',
    MEME: 'Memecoin',
    BONK: 'Bonk',
    SUI: 'Sui',
    ORDI: 'Ordinals',
    ENS: 'Ethereum Name Service',
    ALGO: 'Algorand',
    ARB: 'Arbitrum',
    WIF: 'Dogwifhat',
    MYRO: 'Myro',
    NOS: 'Nosana',
    JUP: 'Jupiter',
    BLUR: 'Blur',
    KATA: 'Katana Inu',
    COQ: 'Coq Inu',
    WASSIE: 'Wassie',
    FET: 'Fetch.ai',
    NEAR: 'NEAR Protocol',
    AI: 'Artificial Intelligence',
    BOB: 'BOB',
    SLERF: 'Slerf',
    BOME: 'BOME',
    STX: 'Stacks',
    TON: 'Toncoin',
    RNDR: 'Render',
    MOG: 'Mogcoin',
    INJ: 'Injective',
    MNT: 'Mantle',
    BEAM: 'Beam',
    STRK: 'Strike',
    NOCHILL: 'No Chill',
    MEW: 'MEW',
    GNO: 'Gnosis',
    WAVES: 'Waves',
    XYO: 'XYO Network',
    TRUMP: 'Trump',
    FARTCOIN: 'Fartcoin',
    PNUT: 'Peanut',
    HYPE: 'Hype'
  };
  return names[currency.toUpperCase()] || currency.toUpperCase();
};

export function DepositModal({ isOpen, onClose, wallet }: DepositModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState('')
  const [selectedCurrency, setSelectedCurrency] = useState('')
  const [open, setOpen] = useState(false)
  const supabase = createClientComponentClient()
  const [fromSearchQuery, setFromSearchQuery] = useState('')
  const [destinationTag, setDestinationTag] = useState('')

  // Define FIAT_CURRENCIES constant
  const FIAT_CURRENCIES = ['ngn', 'usd', 'eur', 'gbp'];

  const fetchAddress = async (currency?: string, network?: string) => {
    if (!currency || !network) {
      console.log('[DepositModal] Missing required parameters:', { currency, network });
      setError('Please select a currency and network');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setAddress('');
      setDestinationTag('');

      console.log('[DepositModal] Fetching address for:', { currency, network });
      
      // First try to get existing addresses
      const response = await fetch(
        `/api/wallet/address?currency=${currency}&network=${network}`,
        { method: 'GET' }
      );

      const data = await response.json();
      console.log('[DepositModal] Address API response:', data);

      if (!response.ok) {
        // If the error indicates account setup is pending, show a more user-friendly message
        if (data.code === 'ACCOUNT_SETUP_PENDING') {
          toast({
            title: "Account Setup in Progress",
            description: "Your account is still being set up. Please try again in a few minutes.",
            variant: "default"
          });
          onClose();
          return;
        }
        
        const errorMessage = data.error || data.message || 'Failed to fetch deposit address';
        console.error('[DepositModal] API error:', { status: response.status, error: errorMessage });
        throw new Error(errorMessage);
      }

      if (data.status === 'error') {
        throw new Error(data.error || data.message || 'Failed to fetch deposit address');
      }

      // Handle fiat currencies
      if (data.data?.is_crypto === false) {
        setError(data.data.message || 'Please use bank transfer for fiat deposits');
        return;
      }

      // Validate deposit address
      if (!data.data?.address) {
        throw new Error('No deposit address returned from API');
      }

      setAddress(data.data.address);
      if (data.data.tag) {
        setDestinationTag(data.data.tag);
      }

    } catch (error) {
      console.error('[DepositModal] Error fetching address:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate deposit address');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      console.log('[DepositModal] Modal closed, resetting state');
      setAddress('');
      setDestinationTag('');
      setError('');
      setLoading(false);
      setSelectedCurrency('');
      setSelectedNetwork('');
      return;
    }

    if (!wallet?.currency) {
      console.error('[DepositModal] No wallet currency available');
      return;
    }

    const currency = wallet.currency.toLowerCase();
    setSelectedCurrency(currency);
    console.log('[DepositModal] Modal opened/currency changed:', { currency });

    if (FIAT_CURRENCIES.includes(currency)) {
      console.log('[DepositModal] Fiat currency detected:', currency);
      setError('Please use bank transfer for fiat deposits');
      return;
    }

    const networks = NETWORKS_BY_CURRENCY[currency];
    if (!networks?.length) {
      console.error('[DepositModal] No networks available for currency:', currency);
      setError(`${currency.toUpperCase()} deposits are not supported`);
      return;
    }

    console.log('[DepositModal] Available networks:', networks);
    const recommendedNetwork = networks.find(n => n.isRecommended);
    const defaultNetwork = recommendedNetwork || networks[0];
    
    if (defaultNetwork) {
      console.log('[DepositModal] Setting default network:', defaultNetwork.id);
      setSelectedNetwork(defaultNetwork.id);
      // Add a small delay to ensure state is updated
      setTimeout(() => {
        fetchAddress(currency, defaultNetwork.id);
      }, 100);
    }
  }, [isOpen, wallet?.currency]);


  const handleNetworkChange = (network: string) => {
    setSelectedNetwork(network);
    if (selectedCurrency) {
      fetchAddress(selectedCurrency, network);
    }
  };

  const handleCurrencyChange = (currency: string) => {
    const currencyLower = currency.toLowerCase();
    setSelectedCurrency(currencyLower);
    setAddress('');
    setDestinationTag('');
    setError('');

    if (FIAT_CURRENCIES.includes(currencyLower)) {
      setError('Please use bank transfer for fiat deposits');
      return;
    }

    const networks = NETWORKS_BY_CURRENCY[currencyLower];
    if (networks?.length) {
      const defaultNetwork = networks.find(n => n.isRecommended) || networks[0];
      setSelectedNetwork(defaultNetwork.id);
      fetchAddress(currencyLower, defaultNetwork.id);
    } else {
      setError(`${currency.toUpperCase()} deposits are not supported`);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        title: "Success",
        description: "Copied to clipboard",
        className: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400"
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy to clipboard"
      })
    }
  }

  const networks = selectedCurrency ? NETWORKS_BY_CURRENCY[selectedCurrency.toLowerCase()] : []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] sm:max-h-[85vh] overflow-y-auto bg-gradient-to-br from-black via-green-950 to-black border-green-800/50">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg sm:text-xl font-bold text-white">
              Deposit {selectedCurrency?.toUpperCase()}
            </DialogTitle>
            <DialogDescription className="text-sm text-white/70">
              {NETWORKS_BY_CURRENCY[selectedCurrency.toLowerCase()]?.[0]?.isFiat 
                ? "Get bank transfer details from support"
                : "Select a network to generate your deposit address"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-3">
            {/* Currency Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-medium text-white">Select Currency</Label>
              <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="w-full h-9 sm:h-10 bg-black text-white border-green-800/50">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="bg-black border-green-800/50 max-h-[200px]">
                  <div className="sticky top-0 z-10 bg-black p-2 border-b border-green-800/50">
                    <Input
                      type="text"
                      placeholder="Search currencies..."
                      value={fromSearchQuery}
                      onChange={(e) => setFromSearchQuery(e.target.value)}
                      className="h-8 bg-black text-white placeholder:text-white/50 border-green-800/50"
                    />
                  </div>
                  <div className="overflow-y-auto max-h-[160px]">
                    {Object.keys(NETWORKS_BY_CURRENCY)
                      .filter(currency => 
                        !fromSearchQuery || 
                        currency.toLowerCase().includes(fromSearchQuery.toLowerCase()) ||
                        getCurrencyName(currency).toLowerCase().includes(fromSearchQuery.toLowerCase())
                      )
                      .map((currency) => (
                        <SelectItem 
                          key={currency} 
                          value={currency}
                          className="text-white hover:bg-green-900/20 cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{currency.toUpperCase()}</span>
                            <span className="text-xs text-white/70">
                              {getCurrencyName(currency)}
                            </span>
                    </div>
                        </SelectItem>
                      ))}
                  </div>
                </SelectContent>
              </Select>
              </div>

            {/* Network Selection - Only show for non-fiat currencies */}
            {networks && networks.length > 1 && !networks[0].isFiat && (
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium text-white">Select Network</Label>
                <Select value={selectedNetwork} onValueChange={handleNetworkChange}>
                  <SelectTrigger className="w-full h-9 sm:h-10 bg-black text-white border-green-800/50">
                      <SelectValue placeholder="Select network" />
                    </SelectTrigger>
                  <SelectContent className="bg-black border-green-800/50">
                    {networks.map((network) => (
                        <SelectItem 
                          key={network.id} 
                          value={network.id}
                        className="text-white"
                        >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{network.name}</span>
                            {network.isRecommended && (
                              <span className="text-[10px] sm:text-xs text-green-400">(Recommended)</span>
                            )}
                          </div>
                          {network.fee && (
                            <span className="text-[10px] sm:text-xs text-white/70">Fee: ~{network.fee}</span>
                          )}
                        </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedNetwork === 'trc20' && (
                  <p className="text-xs text-green-400">
                      TRC20 is recommended for faster and cheaper transactions
                    </p>
                  )}
                </div>
              )}

            {/* Address Display or Fiat Message */}
            {error ? (
              <Alert className="bg-red-900/20 border-red-800/50 py-2">
                <Icons.warning className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-xs sm:text-sm text-red-100">
                  {error}
                </AlertDescription>
              </Alert>
            ) : address ? (
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex justify-center p-3 bg-white rounded-lg">
                  <QRCodeSVG 
                    value={address} 
                    size={150}
                    level="H"
                    includeMargin
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium text-white">Deposit Address</Label>
                    <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-black px-2 py-1.5 text-xs sm:text-sm break-all text-white">
                        {address}
                      </code>
                      <Button
                      variant="ghost"
                        size="icon"
                      className="h-8 w-8 text-green-400 hover:text-green-300"
                        onClick={() => handleCopy(address)}
                      >
                        {copied ? (
                          <Icons.check className="h-4 w-4" />
                        ) : (
                          <Icons.copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                <Alert className="bg-yellow-900/20 border-yellow-800/50 py-2">
                  <Icons.warning className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-xs sm:text-sm text-yellow-100">
                    Only send {selectedCurrency?.toUpperCase()} to this address on the {selectedNetwork.toUpperCase()} network.
                      Sending any other asset may result in permanent loss.
                    </AlertDescription>
                  </Alert>
              </motion.div>
            ) : (
              <motion.div 
                className="flex flex-col items-center justify-center py-4 space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {loading ? (
                  <>
                    <Icons.spinner className="h-6 w-6 text-green-400 animate-spin" />
                    <p className="text-xs sm:text-sm text-white">
                      {NETWORKS_BY_CURRENCY[selectedCurrency.toLowerCase()]?.[0]?.isFiat 
                        ? "Getting bank transfer details..."
                        : "Generating deposit address..."
                      }
                    </p>
                  </>
                ) : (
                  <>
                    <Icons.info className="h-6 w-6 text-green-400" />
                    <p className="text-xs sm:text-sm text-white">
                      {NETWORKS_BY_CURRENCY[selectedCurrency.toLowerCase()]?.[0]?.isFiat 
                        ? "Contact support for bank transfer details"
                        : selectedCurrency 
                          ? 'Select a network to generate a deposit address' 
                          : 'Select a currency to continue'
                      }
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
} 