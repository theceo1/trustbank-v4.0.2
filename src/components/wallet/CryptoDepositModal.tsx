//src/components/wallet/CryptoDepositModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icons } from "@/components/ui/icons";
import { QRCodeSVG } from "qrcode.react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CryptoDepositModalProps {
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
  // ... add more as needed
};

const CryptoDepositModal = ({ isOpen, onClose, wallet }: CryptoDepositModalProps) => {
  const [cryptoNetwork, setCryptoNetwork] = useState<string>("");
  const [cryptoAddress, setCryptoAddress] = useState<string>("");
  const [cryptoAddressLoading, setCryptoAddressLoading] = useState(false);
  const [cryptoAddressError, setCryptoAddressError] = useState("");
  const [cryptoCopied, setCryptoCopied] = useState(false);

  const currencyKey = (wallet?.currency || "").toLowerCase();
  const availableNetworks = NETWORKS_BY_CURRENCY[currencyKey] || [];
  // Helper for recommended network (must be after availableNetworks is declared)
  const recommendedNetwork = availableNetworks.find((n) => n.isRecommended) || availableNetworks[0];

  // Fetch deposit address when modal opens or network changes
  useEffect(() => {
    if (!isOpen || !wallet?.currency) return;
    // Only fetch if the selected network is valid for the currency
    const validNetworkIds = availableNetworks.map(n => n.id);
    if (!cryptoNetwork || !validNetworkIds.includes(cryptoNetwork)) return;
    setCryptoAddress("");
    setCryptoAddressError("");
    setCryptoAddressLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/wallet/address?currency=${encodeURIComponent(wallet.currency)}&network=${encodeURIComponent(cryptoNetwork)}`, {
          method: "GET",
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || "Failed to fetch deposit address");
        }
        setCryptoAddress(data.data?.address || data.data?.deposit_address || "");
      } catch (err: any) {
        setCryptoAddressError(err.message || "Failed to fetch deposit address");
      } finally {
        setCryptoAddressLoading(false);
      }
    })();
  }, [isOpen, cryptoNetwork, wallet?.currency, availableNetworks]);

  // Auto-select the only network if just one
  useEffect(() => {
    if (!isOpen) return;
    if (availableNetworks.length === 1) {
      setCryptoNetwork(availableNetworks[0].id);
    } else if (!cryptoNetwork && recommendedNetwork) {
      setCryptoNetwork(recommendedNetwork.id);
    }
  }, [isOpen, availableNetworks, cryptoNetwork, recommendedNetwork]);

  // Copy address to clipboard
  const handleCopyCrypto = async () => {
    if (!cryptoAddress) return;
    try {
      await navigator.clipboard.writeText(cryptoAddress);
      setCryptoCopied(true);
      setTimeout(() => setCryptoCopied(false), 1500);
    } catch {
      setCryptoCopied(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent
  aria-describedby="crypto-deposit-modal-desc"
  aria-labelledby="crypto-deposit-modal-title"
  className="bg-gradient-to-br from-green-600 via-green-500 to-green-400 bg-clip-padding text-black border-none shadow-2xl max-w-xs w-[94vw] mx-auto p-2 rounded-lg min-w-[220px]"
>
  <DialogTitle id="crypto-deposit-modal-title">Crypto Deposit</DialogTitle>
  <DialogDescription id="crypto-deposit-modal-desc">
    Copy the address below to deposit your crypto assets.
  </DialogDescription>


        <DialogTitle className="text-lg font-bold text-center mb-2 md:mb-3 text-black">Deposit Crypto</DialogTitle>
        <DialogDescription className="text-center mb-3 md:mb-4 text-base md:text-sm text-black">
          Send only <span className="font-semibold">{wallet?.currency?.toUpperCase()}</span> to this address.<br className="hidden md:block" /> Network must match exactly. Deposits are credited after blockchain confirmation.
        </DialogDescription>

        {/* Network selection */}
        {availableNetworks.length > 1 && (
          <div className="mb-2 w-full">
            <Label htmlFor="crypto-network" className="text-black text-sm">Network</Label>
            <Select
              value={cryptoNetwork}
              onValueChange={setCryptoNetwork}
              disabled={cryptoAddressLoading}
            >
              <SelectTrigger id="crypto-network" className="w-full bg-black text-white border-none focus:ring-2 focus:ring-green-400">
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent className="bg-black text-white border-none">
                {availableNetworks.map((net) => (
                  <SelectItem key={net.id} value={net.id} className="bg-black text-white hover:bg-green-700">
                    {net.name} {net.fee ? `(${net.fee} fee)` : ''}
                    {net.isRecommended && ' • Recommended'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-slate-500 mt-1">
              {`We've picked the best network for you (${availableNetworks.find(n => n.id === cryptoNetwork)?.name || ''}), but you can change it if you prefer another network for your deposit.`}
            </div>
          </div>
        )}
        {/* For single-network, show info text but no dropdown */}
        {availableNetworks.length === 1 && (
          <div className="mb-2 w-full">
            <Label className="block text-black">Network</Label>
            <div className="text-black font-semibold">{availableNetworks[0].name}</div>
            <div className="text-xs text-slate-500 mt-1">
              {`This is the only supported network for ${wallet?.currency?.toUpperCase()}.`}
            </div>
          </div>
        )}

        {/* Address display */}
        {cryptoNetwork && (
          <div className="flex flex-col items-center gap-1 mt-1 w-full">
            {cryptoAddressLoading && <Icons.spinner className="animate-spin text-lg text-black" />}
            {cryptoAddressError && (
              <Alert variant="destructive"><AlertDescription>{cryptoAddressError}</AlertDescription></Alert>
            )}
            {!cryptoAddressLoading && cryptoAddress && (
              <>
                <Label htmlFor="crypto-deposit-address" className="text-black">Deposit Address</Label>
                <div className="flex items-center gap-1 w-full bg-black rounded-lg p-1">
                  <Input
                    id="crypto-deposit-address"
                    type="text"
                    value={cryptoAddress}
                    readOnly
                    className="flex-1 bg-black text-white border-none placeholder:text-slate-400 focus:ring-green-200 text-xs px-2 py-1 min-h-0 rounded-lg"
                    aria-label="Crypto deposit address"
                  />
                  <Button
                    variant="outline"
                    onClick={handleCopyCrypto}
                    aria-label="Copy deposit address"
                    className={cryptoCopied ? "shrink-0 bg-slate-700 text-white" : "shrink-0 bg-black text-white text-xs px-2 py-1 min-h-0 border-none rounded-lg"}
                  >
                    {cryptoCopied ? <Check className="h-4 w-4" /> : 'Copy'}
                  </Button>
                </div>
                <div className="flex justify-center my-1">
                  <QRCodeSVG value={cryptoAddress} size={125} bgColor="#FFFFFF00" fgColor="#111" />
                </div>
              </>
            )}
            {/* Warning message always shown */}
            <div className="text-xs text-slate-700 text-center mt-1">
              Send only <span className="font-semibold">{wallet?.currency?.toUpperCase()}</span> via <span className="font-semibold">{availableNetworks.find(n => n.id === cryptoNetwork)?.name}</span>.<br />
              <span className="">Sending any other asset may result in permanent loss.</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CryptoDepositModal;
