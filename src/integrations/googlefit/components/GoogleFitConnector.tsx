import googleFitLogo from "../../../assets/google-fit-logo.png";
import { useGoogleFit } from "../hooks/useGoogleFit";

interface GoogleFitConnectorProps {
    variant?: "row" | "grid";
}

export function GoogleFitConnector({ variant = "row" }: GoogleFitConnectorProps) {
    const { isConnected, connect, disconnect } = useGoogleFit();

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isConnected) {
            disconnect();
        } else {
            connect();
        }
    };

    if (variant === "grid") {
        return (
            <button 
                className="w-full h-full flex flex-col items-center justify-center relative cursor-pointer group/btn bg-transparent border-none p-0"
                onClick={handleToggle}
                title={isConnected ? "Disconnect Google Fit" : "Connect Google Fit"}
            >
                <div className="relative">
                    <img 
                        src={googleFitLogo} 
                        alt="Google Fit" 
                        className={`w-9 h-9 object-contain transition-all duration-300 ${isConnected ? 'grayscale-0 scale-110' : 'grayscale'}`} 
                    />
                    <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm transition-all duration-300 ${isConnected ? 'bg-green-500 scale-100' : 'bg-gray-300 scale-75'}`} />
                </div>
                {isConnected && (
                    <span className="absolute -bottom-2 text-[8px] font-bold text-green-600 uppercase tracking-tighter animate-pulse">
                        Connected
                    </span>
                )}
            </button>
        );
    }

    return (
        <div className="flex items-center justify-between py-2 group transition-all w-full">
            <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-gray-900">Google Fit</span>
                <span className="text-[10px] text-gray-500">{isConnected ? 'Connected' : 'Not connected'}</span>
            </div>
            <button
                onClick={handleToggle}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isConnected ? 'border-[#fcc61f]' : 'border-gray-200'}`}
            >
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isConnected ? 'bg-[#fcc61f] scale-100' : 'bg-transparent scale-0'}`} />
            </button>
        </div>
    );
}
