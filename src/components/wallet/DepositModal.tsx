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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion } from "framer-motion"

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
}>> = {
  btc: [{ id: 'btc', name: 'Bitcoin Network' }],
  eth: [{ id: 'erc20', name: 'ERC20' }],
  usdt: [
    { id: 'trc20', name: 'TRC20', isRecommended: true, fee: '1 USDT' },
    { id: 'erc20', name: 'ERC20', fee: '10-20 USDT' },
    { id: 'bep20', name: 'BEP20 (BSC)', fee: '0.5-1 USDT' }
  ],
  usdc: [
    { id: 'erc20', name: 'ERC20' },
    { id: 'bep20', name: 'BEP20 (BSC)' }
  ],
  bnb: [{ id: 'bep20', name: 'BEP20 (BSC)' }],
  matic: [{ id: 'polygon', name: 'Polygon Network' }],
  sol: [{ id: 'sol', name: 'Solana Network' }],
  dot: [{ id: 'dot', name: 'Polkadot Network' }],
  ada: [{ id: 'ada', name: 'Cardano Network' }],
  xrp: [{ id: 'xrp', name: 'XRP Network' }],
  doge: [{ id: 'doge', name: 'Dogecoin Network' }],
  link: [{ id: 'erc20', name: 'ERC20' }],
  aave: [{ id: 'erc20', name: 'ERC20' }],
  uni: [{ id: 'erc20', name: 'ERC20' }],
  cake: [{ id: 'bep20', name: 'BEP20 (BSC)' }],
  shib: [{ id: 'erc20', name: 'ERC20' }],
}

export function DepositModal({ isOpen, onClose, wallet }: DepositModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState('')
  const [selectedCurrency, setSelectedCurrency] = useState('')
  const supabase = createClientComponentClient()

  // Reset state when modal opens or currency changes
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setAddress(null)
      setSelectedCurrency(wallet?.currency || '')
      
      // Only fetch address for crypto deposits
      if (wallet?.currency) {
        // Get available networks for the currency
        const networks = NETWORKS_BY_CURRENCY[wallet.currency.toLowerCase()]
        if (networks?.length === 1) {
          setSelectedNetwork(networks[0].id)
          fetchAddress(networks[0].id)
        } else if (wallet.currency.toUpperCase() === 'USDT') {
          // Default to TRC20 for USDT as it's recommended
          const tronNetwork = networks?.find(n => n.id === 'trc20')
          if (tronNetwork) {
            setSelectedNetwork(tronNetwork.id)
            fetchAddress(tronNetwork.id)
          }
        }
      }
    }
  }, [isOpen, wallet?.currency])

  const fetchAddress = async (network: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const response = await fetch(`/api/wallet/address?currency=${selectedCurrency?.toLowerCase()}&network=${network}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch deposit address')
      }

      if (data.status === 'success' && data.data?.address) {
        setAddress(data.data.address)
      } else {
        throw new Error('No deposit address found')
      }
    } catch (error) {
      console.error('Error fetching address:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch deposit address')
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to fetch deposit address'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNetworkChange = (network: string) => {
    setSelectedNetwork(network)
    fetchAddress(network)
  }

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency)
    setSelectedNetwork('')
    setAddress(null)
    
    const networks = NETWORKS_BY_CURRENCY[currency.toLowerCase()]
    if (networks?.length === 1) {
      setSelectedNetwork(networks[0].id)
      fetchAddress(networks[0].id)
    }
  }

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
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-green-50/90 via-white/95 to-green-100/90 dark:from-green-950/90 dark:via-gray-900/95 dark:to-green-900/90 backdrop-blur-xl border-green-200/50 dark:border-green-800/50">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
              Deposit {selectedCurrency?.toUpperCase()}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Select a network to generate your deposit address
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Currency Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Currency</Label>
              <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="w-full border-green-200 focus:ring-green-600">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(NETWORKS_BY_CURRENCY).map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Network Selection */}
            {networks && networks.length > 1 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Network</Label>
                <Select value={selectedNetwork} onValueChange={handleNetworkChange}>
                  <SelectTrigger className="w-full border-green-200 focus:ring-green-600">
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent>
                    {networks.map((network) => (
                      <SelectItem 
                        key={network.id} 
                        value={network.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          {network.name}
                          {network.isRecommended && (
                            <span className="text-xs text-green-600 font-medium">(Recommended)</span>
                          )}
                        </div>
                        {network.fee && (
                          <span className="text-xs text-gray-500">Fee: ~{network.fee}</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedNetwork === 'trc20' && (
                  <p className="text-sm text-green-600">
                    TRC20 is recommended for faster and cheaper transactions
                  </p>
                )}
              </div>
            )}

            {/* Address Display */}
            {address ? (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex justify-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <QRCodeSVG 
                    value={address} 
                    size={200}
                    level="H"
                    includeMargin
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Deposit Address</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-white/50 dark:bg-gray-800/50 px-2 py-1.5 text-sm break-all">
                      {address}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-600 hover:text-green-700"
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

                <Alert className="bg-yellow-50/50 dark:bg-yellow-900/20 border-yellow-200/50 dark:border-yellow-800/50">
                  <Icons.warning className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-600 dark:text-yellow-400">
                    Only send {selectedCurrency?.toUpperCase()} to this address on the {selectedNetwork.toUpperCase()} network.
                    Sending any other asset may result in permanent loss.
                  </AlertDescription>
                </Alert>
              </motion.div>
            ) : (
              <motion.div 
                className="flex flex-col items-center justify-center py-8 space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {loading ? (
                  <>
                    <Icons.spinner className="h-8 w-8 text-green-600 animate-spin" />
                    <p className="text-sm text-green-600">
                      Generating deposit address...
                    </p>
                  </>
                ) : (
                  <>
                    <Icons.info className="h-8 w-8 text-green-600" />
                    <p className="text-sm text-green-600">
                      {selectedCurrency ? 'Select a network to generate a deposit address' : 'Select a currency to continue'}
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