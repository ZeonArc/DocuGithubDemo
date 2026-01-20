import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useAppStore } from "@/store/useAppStore";

const CODE_SYMBOLS = [
    "</>", "{ }", "func", "const", "#", "git", "npm", "div", "&&", "||", "=>", "[]", "()"
];

export function Background() {
    const blob1Ref = useRef<HTMLDivElement>(null);
    const blob2Ref = useRef<HTMLDivElement>(null);
    const mouseBlobRef = useRef<HTMLDivElement>(null);
    const particlesRef = useRef<(HTMLDivElement | null)[]>([]);
    const { themeVariant } = useAppStore();

    useEffect(() => {
        // 1. Random Float for Blobs
        const animateBlob = (target: HTMLDivElement | null) => {
            if (!target) return;

            const randomX = gsap.utils.random(-150, 150);
            const randomY = gsap.utils.random(-150, 150);
            const randomScale = gsap.utils.random(0.8, 1.4);
            const randomRotate = gsap.utils.random(-360, 360);
            const randomDuration = gsap.utils.random(10, 20);

            gsap.to(target, {
                x: randomX,
                y: randomY,
                scale: randomScale,
                rotation: randomRotate,
                duration: randomDuration,
                ease: "sine.inOut",
                onComplete: () => animateBlob(target),
            });
        };

        // 2. Code Particle Animation
        const animateParticle = (target: HTMLDivElement | null) => {
            if (!target) return;

            const duration = gsap.utils.random(10, 25);
            const yMove = gsap.utils.random(-100, 100);
            const xMove = gsap.utils.random(-50, 50);
            const rotate = gsap.utils.random(-45, 45);

            gsap.to(target, {
                y: `+=${yMove}`,
                x: `+=${xMove}`,
                rotation: rotate,
                opacity: gsap.utils.random(0.1, 0.4),
                duration: duration,
                ease: "sine.inOut",
                yoyo: true,
                repeat: -1
            });
        };

        // 3. Mouse Follower
        const xTo = gsap.quickTo(mouseBlobRef.current, "x", { duration: 1.2, ease: "power3" });
        const yTo = gsap.quickTo(mouseBlobRef.current, "y", { duration: 1.2, ease: "power3" });

        const onMouseMove = (e: MouseEvent) => {
            xTo(e.clientX);
            yTo(e.clientY);
        };

        window.addEventListener("mousemove", onMouseMove);

        // Context
        const ctx = gsap.context(() => {
            animateBlob(blob1Ref.current);
            animateBlob(blob2Ref.current);
            particlesRef.current.forEach(p => animateParticle(p));
        });

        return () => {
            ctx.revert();
            window.removeEventListener("mousemove", onMouseMove);
        };
    }, []);

    // Theme Colors
    const colors = themeVariant === 'sunset'
        ? {
            blob1: 'bg-orange-500/20',
            blob2: 'bg-pink-500/20',
            mouse: 'bg-yellow-500/20',
            hue: 'from-orange-500/10 via-red-500/10 to-yellow-500/10',
            particle: 'text-orange-600 dark:text-orange-300'
        }
        : {
            blob1: 'bg-blue-500/20',
            blob2: 'bg-purple-500/20',
            mouse: 'bg-cyan-500/20',
            hue: 'from-indigo-500/10 via-purple-500/10 to-pink-500/10',
            particle: 'text-cyan-600 dark:text-cyan-300'
        };

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-background transition-colors duration-1000">

            {/* Grid Overlay */}
            <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                style={{
                    backgroundImage: `linear-gradient(#999 1px, transparent 1px), linear-gradient(90deg, #999 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }}
            />

            {/* Code Particles */}
            {CODE_SYMBOLS.map((symbol, i) => (
                <div
                    key={i}
                    ref={el => { particlesRef.current[i] = el; }}
                    className={`absolute font-mono font-bold text-sm ${colors.particle} transition-colors duration-1000 select-none z-10`}
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        opacity: 0.4
                    }}
                >
                    {symbol}
                </div>
            ))}

            {/* Global Hue Gradient */}
            <div className={`absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-gradient-to-br ${colors.hue} blur-[120px] opacity-60 animate-hue-infinite transition-all duration-1000`} />

            {/* Floating Blobs */}
            <div
                ref={blob1Ref}
                className={`absolute top-1/4 left-1/4 w-96 h-96 ${colors.blob1} rounded-full blur-[80px] transition-colors duration-1000`}
            />
            <div
                ref={blob2Ref}
                className={`absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] ${colors.blob2} rounded-full blur-[80px] transition-colors duration-1000`}
            />

            {/* Mouse Follower Blob */}
            <div
                ref={mouseBlobRef}
                className={`absolute top-0 left-0 w-64 h-64 ${colors.mouse} rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-1000`}
            />
        </div>
    );
}
