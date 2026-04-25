import googleFitLogo from "../../../assets/google-fit-logo.png";
import { useGoogleFit } from "../hooks/useGoogleFit";
import { Tooltip, TooltipTrigger, TooltipContent } from "../../../components/ui/tooltip";

interface GoogleFitConnectorProps {
    variant?: "row" | "grid";
    disabled?: boolean;
}

export function GoogleFitConnector({ variant = "row", disabled = false }: GoogleFitConnectorProps) {
    const { isConnected, connect, disconnect } = useGoogleFit();

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled && !isConnected) return;
        if (isConnected) {
            disconnect();
        } else {
            connect();
        }
    };

    if (variant === "grid") {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <button 
                        className={`w-full h-full flex flex-col items-center justify-center relative group/btn bg-transparent border-none p-0 ${disabled && !isConnected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                        onClick={handleToggle}
                        disabled={disabled && !isConnected}
                    >
                        <div className="relative">
                            <img 
                                src={googleFitLogo} 
                                alt="Google Fit" 
                                className={`w-9 h-9 object-contain transition-all duration-300 ${isConnected ? 'grayscale-0 scale-110' : 'grayscale'}`} 
                            />
                            <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm transition-all duration-300 ${isConnected ? 'bg-green-500 scale-100' : 'bg-gray-300 scale-75'}`} />
                        </div>
                        {isConnected ? (
                            <span className="absolute -bottom-2 text-[8px] font-bold text-green-600 uppercase tracking-tighter animate-pulse">
                                Connected
                            </span>
                        ) : (
                            <span className="absolute -bottom-2 text-[8px] font-bold text-blue-500 bg-blue-500/10 px-1 rounded uppercase tracking-tighter">
                                Beta
                            </span>
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{isConnected ? "Disconnect Google Fit" : disabled ? "Fitbit Connected" : "Connect Google Fit (Development Mode)"}</p>
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={`flex items-center justify-between py-2 group transition-all w-full ${disabled && !isConnected ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}>
                    <div className="flex flex-col text-left">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">Google Fit</span>
                            <span className="text-[9px] font-bold text-blue-500 border border-blue-500/30 px-1 rounded">BETA</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">
                            {isConnected ? 'Connected' : disabled ? 'Fitbit Connected' : 'Not connected'}
                        </span>
                    </div>
                    <button
                        onClick={handleToggle}
                        disabled={disabled && !isConnected}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isConnected ? 'border-[#fcc61f]' : 'border-border'} ${disabled && !isConnected ? 'cursor-not-allowed' : ''}`}
                    >
                        <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isConnected ? 'bg-[#fcc61f] scale-100' : 'bg-transparent scale-0'}`} />
                    </button>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>Google Fit integration is currently in Development Mode</p>
            </TooltipContent>
        </Tooltip>
    );
}
