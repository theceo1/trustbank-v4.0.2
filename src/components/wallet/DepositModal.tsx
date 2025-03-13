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
import { useToast } from "@/hooks/use-toast"
import { Icons } from "@/components/ui/icons"
import { QRCodeSVG } from 'qrcode.react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  wallet: {
    id: string
    currency: string
    balance: string
  }
}

// Networks available for each currency
const NETWORKS_BY_CURRENCY: Record<string, Array<{
  id: string;
  name: string;
  isRecommended?: boolean;
  fee?: string;
}>> = {
  btc: [{ id: 'bitcoin', name: 'Bitcoin Network' }],
  eth: [{ id: 'ethereum', name: 'ERC20' }],
  usdt: [
    { id: 'tron', name: 'TRC20', isRecommended: true, fee: '1 USDT' },
    { id: 'ethereum', name: 'ERC20', fee: '10-20 USDT' },
    { id: 'bsc', name: 'BEP20 (BSC)', fee: '0.5-1 USDT' }
  ],
  usdc: [
    { id: 'ethereum', name: 'ERC20' },
    { id: 'bsc', name: 'BEP20 (BSC)' }
  ],
  bnb: [{ id: 'bsc', name: 'BEP20 (BSC)' }],
  matic: [{ id: 'polygon', name: 'Polygon Network' }]
}

export function DepositModal({ isOpen, onClose, wallet }: DepositModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState('')
  const [selectedCrypto, setSelectedCrypto] = useState(wallet.currency)
  const [depositMethod, setDepositMethod] = useState<'bank' | 'crypto'>('bank')
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (isOpen && selectedCrypto && selectedCrypto.toLowerCase() !== 'ngn') {
      setError(null)
      setAddress(null)
      
      // Get available networks for the currency
      const networks = NETWORKS_BY_CURRENCY[selectedCrypto.toLowerCase()]
      if (networks?.length === 1) {
        setSelectedNetwork(networks[0].id)
        fetchAddress(networks[0].id)
      } else if (selectedCrypto.toUpperCase() === 'USDT') {
        // Default to TRC20 for USDT as it's recommended
        const tronNetwork = networks.find(n => n.id === 'tron')
        if (tronNetwork) {
          setSelectedNetwork(tronNetwork.id)
          fetchAddress(tronNetwork.id)
        }
      }
    }
  }, [isOpen, selectedCrypto])

  const fetchAddress = async (network: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const response = await fetch(`/api/wallet/address?currency=${selectedCrypto.toLowerCase()}&network=${network}`, {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deposit</DialogTitle>
          <DialogDescription>
            Choose your preferred deposit method
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={depositMethod} onValueChange={(value) => setDepositMethod(value as 'bank' | 'crypto')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
            <TabsTrigger value="crypto">Crypto</TabsTrigger>
          </TabsList>

          <TabsContent value="bank" className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Bank Name</span>
                  <span className="text-sm">T.B.D</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Account Name</span>
                  <span className="text-sm text-green-600">trustBank Technologies</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Account Number</span>
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-muted px-2 py-1">T.B.D</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-600 hover:text-green-700"
                      onClick={() => handleCopy('T.B.D')}
                    >
                      {copied ? (
                        <Icons.check className="h-4 w-4" />
                      ) : (
                        <Icons.copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <Icons.info className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Your deposit will be credited to your NGN wallet within 5-10 minutes after payment confirmation.
                Please use your registered email as reference when making the transfer.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="crypto" className="space-y-4">
            <div className="space-y-2">
              <Label>Select Cryptocurrency</Label>
              <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                <SelectTrigger className="border-green-200 focus:ring-green-600">
                  <SelectValue placeholder="Select cryptocurrency" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(NETWORKS_BY_CURRENCY).map((crypto) => (
                    <SelectItem key={crypto} value={crypto.toUpperCase()}>
                      {crypto.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCrypto && NETWORKS_BY_CURRENCY[selectedCrypto.toLowerCase()]?.length > 1 && (
              <div className="space-y-2">
                <Label>Select Network</Label>
                <Select value={selectedNetwork} onValueChange={handleNetworkChange}>
                  <SelectTrigger className="border-green-200 focus:ring-green-600">
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent>
                    {NETWORKS_BY_CURRENCY[selectedCrypto.toLowerCase()].map((network) => (
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
                {selectedNetwork === 'tron' && (
                  <p className="text-sm text-green-600">
                    TRC20 is recommended for faster and cheaper transactions
                  </p>
                )}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Icons.spinner className="h-8 w-8 animate-spin text-green-600" />
                <p className="text-sm text-green-600">
                  Generating deposit address...
                </p>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <Icons.warning className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : address ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <QRCodeSVG value={address} size={200} />
                </div>
                <div className="space-y-2">
                  <Label>Deposit Address</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-muted p-2 font-mono text-sm break-all">
                      {address}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(address)}
                      className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                    >
                      {copied ? (
                        <Icons.check className="h-4 w-4" />
                      ) : (
                        <Icons.copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                  <Icons.warning className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-600">
                    Only send {selectedCrypto.toUpperCase()} to this address on the {selectedNetwork.toUpperCase()} network.
                    Sending any other asset may result in permanent loss.
                  </AlertDescription>
                </Alert>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 