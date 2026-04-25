import { ConnectButton } from "@razorlabs/razorkit"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { useSound } from "../hooks/useSound"
import buttonImg from "../assets/gameframe/button.png"
import bgMobile from "../assets/Backgroundmobile.png"
import bgDesktop from "../assets/Backgrounddesktop.png"

export default function LoginPage() {
    const [activeModal, setActiveModal] = useState<string | null>(null)
    const [isMobile, setIsMobile] = useState(false)
    const { playClick } = useSound()

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const modalContent: Record<string, { title: string; content: string }> = {
        privacy: {
            title: "Privacy Policy",
            content: "We respect your privacy. Puffer Walks only collects necessary data to sync your fitness progress, including your name, email, and Fitbit step data. This information is shared with Movement Protocol for notarization on the blockchain."
        },
        terms: {
            title: "Terms of Service",
            content: "By using Puffer Walks, you agree to participate fairly in the fitness challenges. Your step data will be verified by our Oracle. Users found manipulating data may be disqualified from rewards."
        },
        policy: {
            title: "Our Policy",
            content: "Puffer Walks is committed to transparency. All rewards and game rules are governed by smart contracts on the Movement Network. Please ensure your wallet and fitness accounts are properly linked to ensure accurate tracking."
        }
    }

    const buttonStyle = {
        backgroundImage: `url(${buttonImg})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
    }

    const backgroundStyle = {
        backgroundImage: `url(${isMobile ? bgMobile : bgDesktop})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
    }

    return (
        <div 
            className="min-h-screen overflow-hidden text-foreground font-sans flex flex-col items-center p-4 selection:bg-accent/20 selection:text-accent"
            style={backgroundStyle}
        >
            {/* Top Section - Title */}
            <div className="w-full mt-24 sm:mt-32 flex flex-col items-center">
                <div className="flex flex-col text-5xl sm:text-6xl md:text-7xl font-xirod justify-center items-center leading-none">
                    <motion.span
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 80, damping: 15 }}
                        className="drop-shadow-2xl text-white z-10"
                    >
                        Puffer
                    </motion.span>
                    <motion.span
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 80, 
                            damping: 15,
                            delay: 0.4
                        }}
                        className="drop-shadow-2xl text-white font-xirod"
                    >
                        Walks
                    </motion.span>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="mt-auto w-full max-w-[450px] mb-8 z-10 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-4"
                >
                    <div className="w-full flex flex-col items-center gap-4">
                        <div className="w-full max-w-sm [&_button]:!w-full [&_button]:!bg-transparent [&_button]:!text-black [&_button]:!rounded-none [&_button]:!h-16 [&_button]:!font-xirod [&_button]:!text-sm [&_button]:hover:!opacity-90 [&_button]:!transition-all [&_button]:!border-none [&_button]:!flex [&_button]:!justify-center [&_button]:!items-center [&_button]:!mx-auto" style={buttonStyle}>
                            <ConnectButton label="Connect Wallet" />
                        </div>
                    </div>

                    <div className="text-center px-4">
                        <p className="text-xs text-white/80 font-medium leading-relaxed drop-shadow-md">
                            By continuing, Puffer Walks will share your name and email address with the Movement Protocol.
                        </p>
                    </div>
                </motion.div>

                <footer className="mt-8 flex justify-center gap-6">
                    <a 
                        href="/privacy"
                        className="text-[14px] text-white/80 hover:text-white font-medium drop-shadow-md transition-colors"
                    >
                        Privacy Policy
                    </a>
                    <button 
                        onClick={() => { playClick(); setActiveModal('terms'); }}
                        className="text-[14px] text-white/80 hover:text-white font-medium drop-shadow-md transition-colors"
                    >
                        Terms
                    </button>
                    <button 
                        onClick={() => { playClick(); setActiveModal('policy'); }}
                        className="text-[14px] text-white/80 hover:text-white font-medium drop-shadow-md transition-colors"
                    >
                        Policy
                    </button>
                </footer>
            </div>

            {/* Bottom Sheet Modal */}
            <AnimatePresence>
                {activeModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { playClick(); setActiveModal(null); }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-8 z-50 max-h-[80vh] overflow-y-auto shadow-2xl"
                        >
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
                            <div className="max-w-2xl mx-auto flex flex-col">
                                <h2 className="text-2xl font-bold mb-4 text-black">{modalContent[activeModal].title}</h2>
                                <p className="text-gray-600 leading-relaxed text-lg">
                                    {modalContent[activeModal].content}
                                </p>
                                <button
                                    onClick={() => { playClick(); setActiveModal(null); }}
                                    className="w-full max-w-sm mx-auto mt-8 h-16 text-black py-4 font-xirod text-sm hover:opacity-90 transition-colors flex items-center justify-center focus:outline-none"
                                    style={buttonStyle}
                                >
                                    Got it
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
