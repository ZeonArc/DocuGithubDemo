import Layout from "@/components/Layout";
import AnimationLayout from "@/components/AnimationLayout";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function Analysis() {
    const navigate = useNavigate();
    const [status, setStatus] = useState("Connecting to GitHub...");
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Simulate analysis process
        const timers = [
            setTimeout(() => { setStatus("Fetching repository zipball..."); setProgress(20); }, 1000),
            setTimeout(() => { setStatus("Extracting file structure..."); setProgress(40); }, 2500),
            setTimeout(() => { setStatus("Reading README and package files..."); setProgress(60); }, 3500),
            setTimeout(() => { setStatus("Sending context to Gemini API..."); setProgress(80); }, 5000),
            setTimeout(() => { setStatus("Analysis Complete!"); setProgress(100); }, 7000),
            setTimeout(() => { navigate("/config"); }, 8000),
        ];

        return () => timers.forEach(clearTimeout);
    }, [navigate]);

    return (
        <Layout>
            <AnimationLayout>
                <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-200px)] gap-8">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">Analyzing Repository</h2>
                        <p className="text-muted-foreground">{status}</p>
                    </div>

                    <div className="relative w-full max-w-md h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mt-8">
                        {progress > 20 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-sm text-green-500">
                                <CheckCircle2 className="h-4 w-4" /> Repository Found
                            </motion.div>
                        )}
                        {progress > 40 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-sm text-green-500">
                                <CheckCircle2 className="h-4 w-4" /> Files Extracted
                            </motion.div>
                        )}
                        {progress > 60 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-sm text-green-500">
                                <CheckCircle2 className="h-4 w-4" /> Structure Parsed
                            </motion.div>
                        )}
                        {progress > 80 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-sm text-green-500">
                                <CheckCircle2 className="h-4 w-4" /> AI Context Ready
                            </motion.div>
                        )}
                    </div>

                    {progress < 100 && (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
                    )}
                </div>
            </AnimationLayout>
        </Layout>
    );
}
