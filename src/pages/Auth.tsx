import Layout from "@/components/Layout";
import AnimationLayout from "@/components/AnimationLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { Lock } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";

export default function Auth() {
    const [token, setToken] = useState("");
    const setGithubToken = useAppStore((state) => state.setGithubToken);
    const repoUrl = useAppStore((state) => state.repoUrl);
    const navigate = useNavigate();

    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(cardRef.current, {
                y: 30,
                opacity: 0,
                duration: 0.8,
                ease: "power2.out"
            });
        });
        return () => ctx.revert();
    }, []);

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        if (token.trim()) {
            setGithubToken(token);
            navigate("/analysis");
        }
    };

    return (
        <Layout>
            <AnimationLayout>
                <div className="container flex items-center justify-center min-h-[calc(100vh-200px)]">
                    <div ref={cardRef} className="w-full max-w-md">
                        <Card className="backdrop-blur-md bg-card/80 border-primary/20 shadow-2xl">
                            <CardHeader>
                                <CardTitle>Authentication</CardTitle>
                                <CardDescription>
                                    Enter your GitHub Personal Access Token to access <strong>{repoUrl || "your repository"}</strong>.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleNext} className="space-y-4">
                                    <div className="relative">
                                        <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="password"
                                            placeholder="ghp_..."
                                            className="pl-9 bg-background/50 border-input/50 focus:border-primary transition-all"
                                            value={token}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToken(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        We only use this to read the repository content. It is not stored permanently.
                                    </p>
                                    <Button type="submit" className="w-full shadow-lg shadow-primary/20">
                                        Authenticate & Analyze
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </AnimationLayout>
        </Layout>
    );
}
