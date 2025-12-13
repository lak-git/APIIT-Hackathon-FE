import { Wifi, WifiOff } from 'lucide-react';

interface ConnectivityBannerProps {
  isOnline: boolean;
}

export function ConnectivityBanner({ isOnline }: ConnectivityBannerProps) {
  return (
    <div className="flex items-center justify-center gap-3 px-4 py-3 bg-primary text-primary-foreground border-b border-primary">
      {isOnline ? (
        <Wifi className="w-5 h-5" />
      ) : (
        <WifiOff className="w-5 h-5" />
      )}
      <p className="m-0">
        {isOnline ? (
          <span>Online</span>
        ) : (
          <span>Offline – data will sync automatically</span>
        )}
      </p>
    </div>
  );
}