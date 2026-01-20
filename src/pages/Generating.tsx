import Layout from "@/components/Layout";
import AnimationLayout from "@/components/AnimationLayout";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

export default function Generating() {
    const navigate = useNavigate();
    const { setGeneratedDoc, repoUrl, githubToken } = useAppStore(); // Get repo details
    const [log, setLog] = useState<string[]>([]);
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Visual Logs (Simulated for UX)
        const steps = [
            "Initializing Gemini 1.5 Pro...",
            "Connecting to n8n backend...",
            "Fetching repository metadata...",
            "Analyzing file structure...",
            "Drafting documentation...",
            "Finalizing Markdown..."
        ];

        let stepIndex = 0;
        const logInterval = setInterval(() => {
            if (stepIndex < steps.length) {
                setLog(prev => [...prev, steps[stepIndex]]);
                stepIndex++;
                if (logContainerRef.current) {
                    logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
                }
            }
        }, 1500);

        // Actual Backend Call
        const generateDocs = async () => {
            try {
                const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
                if (!webhookUrl) {
                    throw new Error("Missing VITE_N8N_WEBHOOK_URL");
                }

                setLog(prev => [...prev, "Sending request to n8n workflow..."]);

                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ repoUrl, githubToken })
                });

                if (!response.ok) {
                    throw new Error(`Backend error: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.markdown) {
                    setGeneratedDoc(data.markdown);
                    navigate("/editor");
                } else {
                    throw new Error("Invalid response format");
                }

            } catch (error) {
                console.error("Generation failed:", error);
                setLog(prev => [...prev, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
                // Fallback for demo if n8n is offline
                setTimeout(() => {
                    setLog(prev => [...prev, "Falling back to demo mode..."]);
                    setGeneratedDoc(`# DocuGithub (Demo Mode)

> **Note**: Connection to n8n failed. This is a generated demo.

## Overview
DocuGithub is a powerful tool to generate documentation.

## Installation
\`\`\`bash
npm install docugithub
\`\`\`
`);
                    navigate("/editor");
                }, 3000);
            } finally {
                clearInterval(logInterval);
            }
        };

        // Start generation
        generateDocs();

        return () => clearInterval(logInterval);
    }, [navigate, setGeneratedDoc, repoUrl, githubToken]);

    return (
        <Layout>
            <AnimationLayout>
                <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
                    <div className="space-y-6 text-center">
                        <div className="relative mx-auto h-24 w-24">
                            <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin"></div>
                            <div className="absolute inset-2 rounded-full border-r-4 border-primary/30 animate-spin reverse"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-bold animate-pulse">AI</span>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold">Generating Documentation</h2>

                        <div ref={logContainerRef} className="h-48 w-full max-w-md overflow-hidden overflow-y-auto bg-black/40 rounded-lg p-4 text-left font-mono text-sm border border-border/50 shadow-inner">
                            {log.map((line, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="mb-1 text-green-400/90"
                                >
                                    <span className="text-muted-foreground mr-2">&gt;</span>{line}
                                </motion.div>
                            ))}
                            <motion.div
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 0.8 }}
                                className="inline-block w-2 h-4 bg-primary ml-1"
                            />
                        </div>
                    </div>
                </div>
            </AnimationLayout>
        </Layout>
    );
}
