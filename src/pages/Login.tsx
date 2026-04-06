import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MousePointerClick, ChevronRight } from "lucide-react"
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import { getAptosWallets } from "@aptos-labs/wallet-standard"
import { motion, AnimatePresence } from "framer-motion"

export default function LoginPage() {
    const { wallets, connect } = useWallet()
    const [showWallets, setShowWallets] = useState(false)

    // Filter out unwanted wallets, remove duplicates, and sort with Nightly first
    const filteredWallets = wallets
        .filter((wallet) => {
            const name = wallet.name.toLowerCase()
            return !name.includes("petra") &&
                !name.includes("google") &&
                !name.includes("apple")
        })
        .filter((wallet, index, self) => {
            return index === self.findIndex((w) => w.name === wallet.name)
        })
        .sort((a, b) => {
            if (a.name.toLowerCase().includes("nightly")) return -1
            if (b.name.toLowerCase().includes("nightly")) return 1
            return 0
        })

    const handleWalletSelect = async (walletName: string) => {
        try {
            if (typeof window !== "undefined") {
                const allWallets = getAptosWallets()
                const selectedWallet = allWallets.aptosWallets.find(w => w.name === walletName)

                if (selectedWallet?.features?.['aptos:connect']) {
                    const networkInfo = {
                        chainId: 126,
                        name: "custom" as const,
                        url: "https://full.mainnet.movementinfra.xyz/v1"
                    }

                    try {
                        const result = await selectedWallet.features['aptos:connect'].connect(false, networkInfo as any)
                        if (result.status === "Approved") {
                            await connect(walletName)
                            return
                        }
                    } catch (connectError) {
                        // Fallback
                    }
                }
            }
            await connect(walletName)
        } catch (error) {
            console.error("Connection failed", error)
        }
    }

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col items-center justify-center p-4 selection:bg-blue-100 selection:text-blue-600">
            <div className="w-full max-w-[450px] bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden p-8 md:p-12">
                <div className="flex flex-col items-center text-center space-y-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Sign in</h1>
                        <p className="text-gray-500 mt-2 font-medium">to continue to Puffer Walks</p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {!showWallets ? (
                        <motion.div
                            key="login-main"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            <div className="pt-4">
                                <Button
                                    onClick={() => setShowWallets(true)}
                                    className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700 rounded-full font-bold text-base transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                                >
                                    Get Started
                                    <ChevronRight className="w-5 h-5" />
                                </Button>
                            </div>
                            
                            <div className="text-center">
                                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                                    By continuing, Puffer Walks will share your name and email address with the Movement Protocol.
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="wallet-list"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <h2 className="text-xl font-bold text-gray-900">Select Account</h2>
                                    <p className="text-sm text-gray-500">Choose a wallet to sign in</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowWallets(false)}
                                    className="text-blue-600 hover:bg-blue-50 font-bold text-sm h-auto py-1.5 px-3 rounded-lg"
                                >
                                    Back
                                </Button>
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                                {filteredWallets.length === 0 ? (
                                    <div className="text-center py-10 opacity-50">
                                        <MousePointerClick className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                        <p className="text-sm font-medium">No wallets detected</p>
                                    </div>
                                ) : (
                                    filteredWallets.map((wallet) => (
                                        <button
                                            key={wallet.name}
                                            className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all group"
                                            onClick={() => handleWalletSelect(wallet.name)}
                                        >
                                            <div className="flex items-center space-x-3">
                                                {wallet.icon && (
                                                    <img
                                                        src={wallet.icon}
                                                        alt={wallet.name}
                                                        className="w-8 h-8 object-contain rounded-lg shadow-sm bg-white p-0.5"
                                                    />
                                                )}
                                                <span className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{wallet.name}</span>
                                            </div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-blue-500 transition-colors" />
                                        </button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <footer className="mt-8 flex gap-6">
                <button className="text-[13px] text-gray-500 hover:text-gray-900 font-medium">Privacy</button>
                <button className="text-[13px] text-gray-500 hover:text-gray-900 font-medium">Terms</button>
                <button className="text-[13px] text-gray-500 hover:text-gray-900 font-medium">Help</button>
            </footer>
        </div>
    )
}
