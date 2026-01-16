// Custom type for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

// Extend the WindowEventMap to include it
interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
}
