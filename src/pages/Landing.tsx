import { useEffect, useRef, useState } from "react";
import * as THREE from 'three';
import { gsap } from "gsap";
import { ArrowRight, Github, Link as LinkIcon, LogIn, Sparkles, FileText, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth0 } from "@auth0/auth0-react";
import RepoSelector from "@/components/RepoSelector";

function HeroParticles() {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current.appendChild(renderer.domElement);

        const geometry = new THREE.BufferGeometry();
        const count = 1500;
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 10;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            size: 0.015,
            color: 0x6366f1,
            transparent: true,
            opacity: 0.6
        });

        const particles = new THREE.Points(geometry, material);
        scene.add(particles);
        camera.position.z = 5;

        const animate = () => {
            requestAnimationFrame(animate);
            particles.rotation.y += 0.0008;
            particles.rotation.x += 0.0003;
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
        };
    }, []);

    return <div ref={mountRef} className="absolute inset-0 z-0 opacity-30 pointer-events-none" />;
}

export default function Landing() {
    const navigate = useNavigate();
    const { setRepoUrl: setStoreRepoUrl, setSessionId } = useAppStore();
    const [repoUrl, setRepoUrl] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const { loginWithPopup, isAuthenticated, user, logout } = useAuth0();
    const [useAuth, setUseAuth] = useState(false);

    const TEST_MODE = !import.meta.env.VITE_AUTH0_DOMAIN;

    useEffect(() => {
        if (!containerRef.current) return;

        const ctx = gsap.context(() => {
            const tl = gsap.timeline();

            tl.from(".landing-title", {
                y: 80,
                opacity: 0,
                duration: 0.8,
                ease: "power4.out"
            })
                .from(".landing-subtitle", {
                    y: 40,
                    opacity: 0,
                    duration: 0.6,
                    ease: "power3.out"
                }, "-=0.4")
                .from(".landing-form", {
                    y: 30,
                    opacity: 0,
                    duration: 0.6,
                    ease: "power2.out"
                }, "-=0.3")
                .from(".feature-card", {
                    y: 40,
                    opacity: 0,
                    duration: 0.5,
                    stagger: 0.1,
                    ease: "power2.out"
                }, "-=0.2");
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!repoUrl) return;

        const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        const owner = match?.[1] || '';
        const repo = match?.[2]?.replace(/\.git$/, '') || '';

        setStoreRepoUrl(repoUrl);

        try {
            const { data, error } = await supabase
                .from('sessions')
                .insert([{
                    repo_url: repoUrl,
                    repo_owner: owner,
                    repo_name: repo,
                    status: 'initialized'
                }])
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setSessionId(data.id);
                gsap.to(containerRef.current, {
                    opacity: 0,
                    y: -30,
                    duration: 0.4,
                    onComplete: () => { navigate("/auth"); }
                });
            }
        } catch (error) {
            console.error("Supabase error:", error);
            navigate("/auth");
        }
    };

    return (
        <div className="relative min-h-[calc(100vh-120px)] flex flex-col" ref={containerRef}>
            <HeroParticles />

            {/* Hero Section */}
            <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16">
                <div className="w-full max-w-4xl flex flex-col items-center text-center">
                    <div className="mb-6 inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-400 backdrop-blur-xl">
                        <Sparkles className="mr-2 h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-wide">AI-Powered Documentation</span>
                    </div>

                    <h1 className="landing-title text-5xl md:text-7xl font-bold tracking-tight mb-6 text-white">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-indigo-200">
                            DocuGithub
                        </span>
                    </h1>

                    <p className="landing-subtitle text-lg md:text-xl text-gray-300 mb-10 max-w-2xl leading-relaxed">
                        Transform your GitHub repositories into <span className="text-white font-medium">beautiful, comprehensive documentation</span> in seconds using advanced AI.
                    </p>

                    <div className="landing-form w-full max-w-lg space-y-4">
                        {!useAuth ? (
                            <form onSubmit={handleSubmit} className="flex gap-3">
                                <Input
                                    placeholder="https://github.com/username/repo"
                                    className="h-14 bg-gray-900/80 backdrop-blur-xl border-gray-700/50 text-white placeholder:text-gray-500 flex-1 rounded-xl focus:border-indigo-500 focus:ring-indigo-500/20"
                                    value={repoUrl}
                                    onChange={(e) => setRepoUrl(e.target.value)}
                                />
                                <Button size="lg" className="h-14 px-8 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40">
                                    Start <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </form>
                        ) : (
                            <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl">
                                {!isAuthenticated ? (
                                    <div className="text-center py-3">
                                        <Button onClick={() => loginWithPopup()} size="lg" className="w-full h-12 bg-gray-800 hover:bg-gray-700 text-white rounded-xl border border-gray-600">
                                            <Github className="mr-2 h-5 w-5" /> Sign in with GitHub
                                        </Button>
                                        <p className="text-xs text-gray-500 mt-3">Select from your repositories</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-sm px-1">
                                            <div className="flex items-center gap-2">
                                                <img src={user?.picture} className="w-6 h-6 rounded-full" alt="User" />
                                                <span className="font-medium text-white">Welcome, {user?.given_name || user?.nickname}</span>
                                            </div>
                                            <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} className="text-xs text-red-400 hover:underline">Logout</button>
                                        </div>
                                        <RepoSelector />
                                    </div>
                                )}
                            </div>
                        )}

                        {!TEST_MODE && (
                            <div className="flex justify-center pt-2">
                                <button
                                    onClick={() => setUseAuth(!useAuth)}
                                    className="text-sm text-gray-400 hover:text-indigo-400 transition-colors flex items-center gap-2"
                                >
                                    {useAuth ? (
                                        <><LinkIcon className="w-3 h-3" /> or paste a URL manually</>
                                    ) : (
                                        <><LogIn className="w-3 h-3" /> or sign in to select repo</>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative z-10 py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-bold text-center mb-10 text-white">Why DocuGithub?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="feature-card p-6 rounded-2xl bg-gray-900/60 backdrop-blur-lg border border-gray-700/50 hover:border-indigo-500/30 transition-all hover:bg-gray-900/80 shadow-lg">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4">
                                <Zap className="h-6 w-6 text-indigo-400" />
                            </div>
                            <h3 className="font-semibold mb-2 text-white">Lightning Fast</h3>
                            <p className="text-sm text-gray-400">Generate comprehensive documentation in seconds, not hours.</p>
                        </div>
                        <div className="feature-card p-6 rounded-2xl bg-gray-900/60 backdrop-blur-lg border border-gray-700/50 hover:border-indigo-500/30 transition-all hover:bg-gray-900/80 shadow-lg">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4">
                                <FileText className="h-6 w-6 text-indigo-400" />
                            </div>
                            <h3 className="font-semibold mb-2 text-white">AI-Powered</h3>
                            <p className="text-sm text-gray-400">Powered by Gemini AI to understand your codebase deeply.</p>
                        </div>
                        <div className="feature-card p-6 rounded-2xl bg-gray-900/60 backdrop-blur-lg border border-gray-700/50 hover:border-indigo-500/30 transition-all hover:bg-gray-900/80 shadow-lg">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4">
                                <Shield className="h-6 w-6 text-indigo-400" />
                            </div>
                            <h3 className="font-semibold mb-2 text-white">Push to GitHub</h3>
                            <p className="text-sm text-gray-400">One-click publish directly to your repository.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
