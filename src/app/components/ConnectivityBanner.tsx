import { Wifi, WifiOff } from "lucide-react";

interface ConnectivityBannerProps {
  isOnline: boolean;
}

export function ConnectivityBanner({ isOnline }: ConnectivityBannerProps) {
  return (
    <div
      className={[
        "flex items-center justify-center gap-3 px-4 py-3 border-b",
        "transition-colors duration-300",
        isOnline
          ? "bg-emerald-800 border-emerald-900 text-white"
          : "bg-[#6B1B2B] border-[#571522] text-white",
      ].join(" ")}
    >
      {isOnline ? (
        <Wifi className="w-5 h-5 text-white" />
      ) : (
        <WifiOff className="w-5 h-5 text-white" />
      )}

      <p className="m-0 font-semibold text-sm tracking-wide">
        {isOnline ? "Online" : "Offline – data will sync automatically"}
      </p>
    </div>
  );
}
