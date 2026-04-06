"use client";

import type { ReactNode } from "react";
import { WalletProvider as RazorkitWalletProvider } from "@razorlabs/razorkit";
import "@razorlabs/razorkit/style.css";

interface WalletProviderProps {
    children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
    return (
        <RazorkitWalletProvider autoConnect={true}>
            {children}
        </RazorkitWalletProvider>
    );
}
