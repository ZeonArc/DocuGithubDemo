import Layout from "@/components/Layout";
import AnimationLayout from "@/components/AnimationLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { ArrowRight, Sparkles, FileCode, CheckCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";

export default function Landing() {
    const [repoUrl, setRepoUrl] = useState("");
    const setStoreRepoUrl = useAppStore((state) => state.setRepoUrl);
    const navigate = useNavigate();

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const heroLeftRef = useRef<HTMLDivElement>(null);
    const heroRightRef = useRef<HTMLDivElement>(null);
    const codeCardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            // Staggered Entrance
            tl.from(heroLeftRef.current?.children || [], {
                y: 50,
                opacity: 0,
                duration: 1,
                stagger: 0.15,
                delay: 0.2
            })
                .from(heroRightRef.current, {
                    x: 50,
                    opacity: 0,
                    scale: 0.9,
                    duration: 1.2,
                    ease: "back.out(1.7)"
                }, "-=0.8");

            // Mouse Move Parallax for Code Card
            const onMouseMove = (e: MouseEvent) => {
                if (!codeCardRef.current) return;
                const { innerWidth, innerHeight } = window;
                const x = (e.clientX - innerWidth / 2) / 25; // Sensitivity
                const y = (e.clientY - innerHeight / 2) / 25;

                gsap.to(codeCardRef.current, {
                    rotateY: x,
                    rotateX: -y,
                    duration: 0.5,
                    ease: "power2.out",
                    transformPerspective: 1000
                });
            };

            window.addEventListener("mousemove", onMouseMove);
            return () => window.removeEventListener("mousemove", onMouseMove);

        }, containerRef);

        return () => ctx.revert();
    }, []);

    const handleStart = (e: React.FormEvent) => {
        e.preventDefault();
        if (repoUrl.trim()) {
            setStoreRepoUrl(repoUrl);
            gsap.to(containerRef.current, {
                opacity: 0,
                y: -20,
                duration: 0.5,
                onComplete: () => { navigate("/auth"); }
            });
        }
    };

    return (
        <Layout>
            <AnimationLayout>
                <section ref={containerRef} className="container overflow-hidden pt-12 md:pt-20 lg:pt-32 pb-20 px-8 md:px-12 lg:px-24">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        {/* Left Column: Content */}
                        <div ref={heroLeftRef} className="flex flex-col items-start gap-6 max-w-2xl">
                            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary backdrop-blur-sm">
                                <Sparkles className="mr-2 h-3.5 w-3.5" />
                                <span>No more manual READMEs</span>
                            </div>

                            <h1 className="text-4xl font-extrabold leading-tight tracking-tighter md:text-6xl lg:text-7xl">
                                Code to Documentation. <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">Instantly.</span>
                            </h1>

                            <p className="text-lg text-muted-foreground md:text-xl leading-relaxed max-w-[600px]">
                                Stop wasting time writing docs. Let Gemini analyze your repository and generate perfect, comprehensive documentation in seconds.
                            </p>

                            <div className="w-full max-w-md mt-4">
                                <form onSubmit={handleStart} className="flex w-full gap-2 p-2 bg-background/50 border border-primary/20 rounded-xl backdrop-blur-md shadow-2xl transition-shadow hover:shadow-primary/10">
                                    <Input
                                        type="text"
                                        placeholder="github.com/username/repo"
                                        className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-base placeholder:text-muted-foreground/50"
                                        value={repoUrl}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRepoUrl(e.target.value)}
                                    />
                                    <Button type="submit" size="lg" className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-lg transition-transform hover:scale-105 active:scale-95">
                                        Start
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </form>
                                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground pl-2">
                                    <span className="flex items-center"><CheckCircle className="h-3 w-3 mr-1 text-green-500" /> Free Tier</span>
                                    <span className="flex items-center"><CheckCircle className="h-3 w-3 mr-1 text-green-500" /> No Credit Card</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: 3D Code Preview */}
                        <div ref={heroRightRef} className="relative hidden lg:flex items-center justify-center perspective-1000">
                            <div ref={codeCardRef} className="relative w-full max-w-lg rounded-xl border border-border/50 bg-black/80 backdrop-blur-xl shadow-2xl p-6 transform-item">
                                {/* Window Controls */}
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                    <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                                        <FileCode className="h-3 w-3" />
                                        <span>README.md</span>
                                    </div>
                                </div>

                                {/* Code Mockup */}
                                <div className="space-y-3 font-mono text-sm leading-relaxed">
                                    <div className="flex gap-4">
                                        <span className="text-muted-foreground select-none">1</span>
                                        <span className="text-purple-400"># DocuGithub</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="text-muted-foreground select-none">2</span>
                                        <span className="text-muted-foreground"></span>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="text-muted-foreground select-none">3</span>
                                        <span><span className="text-blue-400">const</span> <span className="text-yellow-300">generateDocs</span> = <span className="text-blue-400">async</span> (repo) ={">"} {"{"}</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="text-muted-foreground select-none">4</span>
                                        <span className="pl-4"><span className="text-green-400">// Automatically analyze code</span></span>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="text-muted-foreground select-none">5</span>
                                        <span className="pl-4"><span className="text-blue-400">await</span> ai.analyze(repo);</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="text-muted-foreground select-none">6</span>
                                        <span className="pl-4"><span className="text-blue-400">return</span> <span className="text-orange-300">"Beautiful Documentation"</span>;</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="text-muted-foreground select-none">7</span>
                                        <span>{"}"}</span>
                                    </div>
                                </div>

                                {/* Floating Decoration */}
                                <div className="absolute -z-10 -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                                <div className="absolute -z-10 -bottom-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
                            </div>
                        </div>

                    </div>
                </section>
            </AnimationLayout>
        </Layout>
    );
}
