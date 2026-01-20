import Layout from "@/components/Layout";
import AnimationLayout from "@/components/AnimationLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useRef, useEffect } from "react";
import gsap from "gsap";

export default function Config() {
    const navigate = useNavigate();
    const { docStyle, setDocStyle, topics, setTopics } = useAppStore();

    const containerRef = useRef<HTMLDivElement>(null);

    const availableTopics = [
        "Overview", "Installation", "Quick Start", "Architecture",
        "API Reference", "Authentication", "Deployment", "Contributing", "License"
    ];

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".config-card", {
                y: 50,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "back.out(1.2)"
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const handleTopicToggle = (topic: string) => {
        if (topics.includes(topic)) {
            setTopics(topics.filter((t: string) => t !== topic));
        } else {
            setTopics([...topics, topic]);
        }
    };

    const handleGenerate = () => {
        navigate("/generating");
    };

    return (
        <Layout>
            <AnimationLayout>
                <div ref={containerRef} className="container py-10 max-w-4xl">
                    <h1 className="text-3xl font-bold mb-6 config-card">Configuration</h1>
                    <div className="grid gap-6">
                        <Card className="config-card backdrop-blur-sm bg-card/60">
                            <CardHeader>
                                <CardTitle>Documentation Style</CardTitle>
                                <CardDescription>Choose the tone and detail level of your documentation.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div
                                    className={cn(
                                        "cursor-pointer rounded-lg border-2 p-4 hover:border-primary transition-all duration-300 hover:scale-[1.02]",
                                        docStyle === 'simple' ? "border-primary bg-primary/10 shadow-md shadow-primary/10" : "border-muted/40 hover:bg-muted/30"
                                    )}
                                    onClick={() => setDocStyle('simple')}
                                >
                                    <h3 className="font-semibold mb-1">Simple & Compact</h3>
                                    <p className="text-sm text-muted-foreground">Concise and straight to the point. Best for small libs or utilities.</p>
                                </div>
                                <div
                                    className={cn(
                                        "cursor-pointer rounded-lg border-2 p-4 hover:border-primary transition-all duration-300 hover:scale-[1.02]",
                                        docStyle === 'detailed' ? "border-primary bg-primary/10 shadow-md shadow-primary/10" : "border-muted/40 hover:bg-muted/30"
                                    )}
                                    onClick={() => setDocStyle('detailed')}
                                >
                                    <h3 className="font-semibold mb-1">Detailed & Elaborative</h3>
                                    <p className="text-sm text-muted-foreground">Comprehensive guides, deeply explained concepts. Best for full frameworks or apps.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="config-card backdrop-blur-sm bg-card/60">
                            <CardHeader>
                                <CardTitle>Topics Included</CardTitle>
                                <CardDescription>Select the sections you want to generate.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {availableTopics.map(topic => (
                                        <label key={topic} className="flex items-center space-x-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="accent-primary h-4 w-4 transition-transform group-hover:scale-110"
                                                checked={topics.includes(topic)}
                                                onChange={() => handleTopicToggle(topic)}
                                            />
                                            <span className="text-sm group-hover:text-primary transition-colors">{topic}</span>
                                        </label>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="config-card backdrop-blur-sm bg-card/60">
                            <CardHeader>
                                <CardTitle>Reference Images</CardTitle>
                                <CardDescription>Add URLs to screenshots or diagrams to include (Optional).</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Input placeholder="https://..." className="bg-background/50" />
                            </CardContent>
                        </Card>

                        <div className="flex justify-end config-card">
                            <Button size="lg" onClick={handleGenerate} className="shadow-lg shadow-primary/20">
                                Generate Documentation
                            </Button>
                        </div>
                    </div>
                </div>
            </AnimationLayout>
        </Layout>
    );
}
