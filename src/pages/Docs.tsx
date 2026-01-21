import { motion } from "framer-motion";
import { FileText, Code, Zap, Book, Terminal, Settings } from "lucide-react";
import { Link } from "react-router-dom";

export default function Docs() {
    const sections = [
        {
            icon: Zap,
            title: "Quick Start",
            description: "Get up and running in under 5 minutes",
            items: [
                "Enter your GitHub repository URL",
                "AI analyzes your codebase structure",
                "Customize preferences and sections",
                "Generate and edit your README",
                "Push directly to GitHub"
            ]
        },
        {
            icon: Terminal,
            title: "API Endpoints",
            description: "Backend webhook endpoints",
            items: [
                "POST /webhook/initialize - Create session",
                "POST /webhook/analyze - AI analysis",
                "POST /webhook/preferences - Set preferences",
                "POST /webhook/generate - Generate README",
                "POST /webhook/chat - AI revisions",
                "POST /webhook/push - Push to GitHub"
            ]
        },
        {
            icon: Settings,
            title: "Configuration",
            description: "Customize your documentation",
            items: [
                "Tone: professional, friendly, technical, casual",
                "Sections: overview, installation, usage, API, etc.",
                "Badges: license, version, build status, etc.",
                "Table of Contents toggle",
                "Emoji style: minimal, moderate, heavy"
            ]
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="container max-w-5xl mx-auto px-4 py-12"
        >
            {/* Header */}
            <div className="text-center mb-16">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary backdrop-blur-xl mb-6">
                    <Book className="mr-2 h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Documentation</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">How DocuGithub Works</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Learn how to use DocuGithub to generate beautiful, comprehensive documentation for your projects.
                </p>
            </div>

            {/* Documentation Sections */}
            <div className="grid gap-8 mb-16">
                {sections.map((section, index) => (
                    <motion.div
                        key={section.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-6 rounded-2xl bg-background/40 backdrop-blur-lg border border-white/5"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <section.icon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
                                <p className="text-muted-foreground mb-4">{section.description}</p>
                                <ul className="space-y-2">
                                    {section.items.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <Code className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <span className="text-muted-foreground">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Tech Stack */}
            <div className="text-center p-8 rounded-2xl bg-background/40 backdrop-blur-lg border border-white/5">
                <h2 className="text-2xl font-bold mb-4">Built With</h2>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary">React + Vite</span>
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary">n8n Workflows</span>
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary">Google Gemini</span>
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary">Supabase</span>
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary">Auth0</span>
                </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                >
                    <FileText className="h-4 w-4" />
                    Get Started Now
                </Link>
            </div>
        </motion.div>
    );
}
