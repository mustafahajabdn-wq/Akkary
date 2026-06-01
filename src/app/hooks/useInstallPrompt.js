import { useCallback, useEffect, useState } from "react";

const DISMISS_KEY = "pwa_install_dismissed";
const SHOW_DELAY_MS = 3000;

export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      setShow(false);
      return;
    }

    let showTimer = null;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setPromptEvent(event);

      if (sessionStorage.getItem(DISMISS_KEY) === "1") {
        setShow(false);
        return;
      }

      showTimer = window.setTimeout(() => {
        setShow(true);
      }, SHOW_DELAY_MS);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setShow(false);
      setPromptEvent(null);
      sessionStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      if (showTimer) window.clearTimeout(showTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!promptEvent) return false;

    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;

    if (outcome === "accepted") {
      setInstalled(true);
      sessionStorage.removeItem(DISMISS_KEY);
    }

    setShow(false);
    setPromptEvent(null);
    return outcome === "accepted";
  }, [promptEvent]);

  const dismiss = useCallback(() => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }, []);

  return {
    show: show && !installed && !!promptEvent,
    install,
    dismiss,
    installed,
    hasPrompt: !!promptEvent,
  };
}
