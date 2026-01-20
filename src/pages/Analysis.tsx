import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { Loader2, CheckCircle, AlertCircle, Github, FileCode, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnalysisStep {
    id: string;
    label: string;
    status: 'pending' | 'loading' | 'complete' | 'error';
    icon: React.ReactNode;
}

export default function Analysis() {
    const navigate = useNavigate();
    const { sessionId, repoUrl, githubToken } = useAppStore();
    const [steps, setSteps] = useState<AnalysisStep[]>([
        { id: 'fetch', label: 'Fetching repository...', status: 'pending', icon: <Github className="w-5 h-5" /> },
        { id: 'extract', label: 'Extracting files...', status: 'pending', icon: <FileCode className="w-5 h-5" /> },
        { id: 'analyze', label: 'Analyzing with AI...', status: 'pending', icon: <Brain className="w-5 h-5" /> },
    ]);
    const [error, setError] = useState<string | null>(null);
    const [analysisComplete, setAnalysisComplete] = useState(false);

    useEffect(() => {
        if (!sessionId || !repoUrl) {
            navigate('/');
            return;
        }

        const runAnalysis = async () => {
            try {
                // Step 1: Fetch
                setSteps(prev => prev.map(s => s.id === 'fetch' ? { ...s, status: 'loading' } : s));

                // Parse owner/repo
                const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
                const owner = match?.[1] || '';
                const repo = match?.[2]?.replace(/\.git$/, '') || '';

                // Call n8n analyze webhook
                const webhookBase = import.meta.env.VITE_N8N_WEBHOOK_BASE;
                const response = await fetch(`${webhookBase}/analyze`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId,
                        owner,
                        repo,
                        githubToken
                    })
                });

                setSteps(prev => prev.map(s => s.id === 'fetch' ? { ...s, status: 'complete' } : s));

                // Step 2: Extract (simulated - n8n handles this)
                setSteps(prev => prev.map(s => s.id === 'extract' ? { ...s, status: 'loading' } : s));
                await new Promise(resolve => setTimeout(resolve, 1000));
                setSteps(prev => prev.map(s => s.id === 'extract' ? { ...s, status: 'complete' } : s));

                // Step 3: Analyze
                setSteps(prev => prev.map(s => s.id === 'analyze' ? { ...s, status: 'loading' } : s));

                if (!response.ok) {
                    throw new Error('Analysis failed');
                }

                await response.json();
                setSteps(prev => prev.map(s => s.id === 'analyze' ? { ...s, status: 'complete' } : s));

                setAnalysisComplete(true);

            } catch (err) {
                console.error('Analysis error:', err);
                setError('Failed to analyze repository. Please try again.');
                setSteps(prev => prev.map(s => s.status === 'loading' ? { ...s, status: 'error' } : s));
            }
        };

        runAnalysis();
    }, [sessionId, repoUrl, githubToken, navigate]);

    const handleContinue = () => {
        navigate('/config');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">Analyzing Repository</h1>
                    <p className="text-muted-foreground">
                        We're scanning your code to understand its structure
                    </p>
                </div>

                <div className="bg-card border rounded-xl p-6 space-y-4">
                    {steps.map((step) => (
                        <div
                            key={step.id}
                            className={`flex items-center gap-4 p-4 rounded-lg transition-all ${step.status === 'complete' ? 'bg-green-500/10' :
                                step.status === 'loading' ? 'bg-primary/10' :
                                    step.status === 'error' ? 'bg-red-500/10' :
                                        'bg-muted/50'
                                }`}
                        >
                            <div className={`${step.status === 'complete' ? 'text-green-500' :
                                step.status === 'loading' ? 'text-primary' :
                                    step.status === 'error' ? 'text-red-500' :
                                        'text-muted-foreground'
                                }`}>
                                {step.status === 'loading' ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : step.status === 'complete' ? (
                                    <CheckCircle className="w-5 h-5" />
                                ) : step.status === 'error' ? (
                                    <AlertCircle className="w-5 h-5" />
                                ) : (
                                    step.icon
                                )}
                            </div>
                            <span className={`flex-1 ${step.status === 'complete' ? 'text-green-500' :
                                step.status === 'loading' ? 'text-foreground' :
                                    step.status === 'error' ? 'text-red-500' :
                                        'text-muted-foreground'
                                }`}>
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                        {error}
                    </div>
                )}

                {analysisComplete && (
                    <Button onClick={handleContinue} className="w-full h-12">
                        Continue to Configuration
                    </Button>
                )}
            </div>
        </div>
    );
}
