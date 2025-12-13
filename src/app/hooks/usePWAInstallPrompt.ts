import { useCallback, useEffect, useState } from "react";

type InstallOutcome = "accepted" | "dismissed";

type InstallChoice = {
  outcome: InstallOutcome;
  platform: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
};

export function usePWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<InstallChoice | null> => {
    if (!deferredPrompt) {
      return null;
    }

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    return choice;
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    setDeferredPrompt(null);
  }, []);

  return {
    canInstall: !!deferredPrompt && !isInstalled,
    promptInstall,
    dismissPrompt,
  };
}
