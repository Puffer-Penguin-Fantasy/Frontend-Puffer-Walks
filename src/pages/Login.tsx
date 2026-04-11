import { ConnectButton } from "@razorlabs/razorkit"
import { motion } from "framer-motion"

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col items-center justify-center p-4 selection:bg-accent/20 selection:text-accent">
            <div className="w-full max-w-[450px] bg-card border border-border rounded-3xl shadow-xl overflow-hidden p-8 md:p-12">
                <div className="flex flex-col items-center text-center space-y-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Sign in</h1>
                        <p className="text-muted-foreground mt-2 font-medium">to continue to Puffer Walks</p>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    <div className="pt-4 w-full flex justify-center">
                        <div className="w-full max-w-sm [&_button]:!w-full [&_button]:!bg-white [&_button]:!text-black [&_button]:!rounded-2xl [&_button]:!h-14 [&_button]:!font-bold [&_button]:!text-base [&_button]:hover:!bg-white/90 [&_button]:!transition-all [&_button]:!border-none [&_button]:!shadow-lg [&_button]:!flex [&_button]:!justify-center [&_button]:!items-center [&_button]:!mx-auto">
                            <ConnectButton label="Connect Wallet" />
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                            By continuing, Puffer Walks will share your name and email address with the Movement Protocol.
                        </p>
                    </div>
                </motion.div>
            </div>

            <footer className="mt-8 flex gap-6">
                <button className="text-[13px] text-gray-500 hover:text-gray-900 font-medium">Privacy</button>
                <button className="text-[13px] text-gray-500 hover:text-gray-900 font-medium">Terms</button>
                <button className="text-[13px] text-gray-500 hover:text-gray-900 font-medium">Help</button>
            </footer>
        </div>
    )
}
