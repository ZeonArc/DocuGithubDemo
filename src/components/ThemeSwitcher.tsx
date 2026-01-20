import { Button } from "@/components/ui/button";
import { Moon, Sun, Palette } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";

export function ThemeSwitcher() {
    const [mode, setMode] = useState<"light" | "dark">("dark");
    const { themeVariant, setThemeVariant } = useAppStore();

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(mode);
    }, [mode]);

    const cycleTheme = () => {
        // Toggle Mode first if needed, or just toggle variants
        if (themeVariant === 'cosmic') setThemeVariant('sunset');
        else setThemeVariant('cosmic');
    };

    return (
        <div className="flex items-center gap-1">
            {/* Light/Dark Toggle */}
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => setMode(mode === "dark" ? "light" : "dark")}
            >
                {mode === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            {/* Theme Variant Cycler */}
            <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-full transition-colors ${themeVariant === 'sunset' ? "text-orange-400 bg-orange-500/10" : "text-purple-400 bg-purple-500/10"}`}
                onClick={cycleTheme}
            >
                <Palette className="h-4 w-4" />
            </Button>
        </div>
    );
}
