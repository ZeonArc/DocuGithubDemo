import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
    Github,
    Eye,
    Code2,
    Loader2,
    CheckCircle,
    Sparkles,
    Copy,
    Download,
    Home,
    FileText,
    Columns2,
    X
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from "framer-motion";

export default function Editor() {
    const navigate = useNavigate();
    const { generatedDoc, sessionId, repoUrl, githubToken } = useAppStore();
    const [content, setContent] = useState(generatedDoc || "# Welcome to DocuGithub Editor\n\nStart typing your documentation or generate one from the homepage.\n\n## Features\n\n- **Live Preview** - See your markdown rendered in real-time\n- **AI Editing** - Select text and use AI to improve it\n- **One-click Publish** - Push directly to GitHub\n\n```javascript\nconst greeting = 'Hello, World!';\nconsole.log(greeting);\n```\n\n## Getting Started\n\n1. Go to the homepage\n2. Enter your GitHub repository URL\n3. Generate documentation with AI\n4. Edit and refine here\n5. Push to GitHub!");
    const [isPublishing, setIsPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [selectedText, setSelectedText] = useState("");
    const [showAIPrompt, setShowAIPrompt] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isAIProcessing, setIsAIProcessing] = useState(false);
    const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (generatedDoc) {
            setContent(generatedDoc);
        }
    }, [generatedDoc]);

    const handleTextSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 10) {
            setSelectedText(selection.toString());
        }
    };

    const handleAIEdit = async () => {
        if (!selectedText || !aiPrompt) return;

        setIsAIProcessing(true);
        try {
            // Using HMAC-authenticated API client
            const result = await api.chat({
                session_id: sessionId || '',
                message: aiPrompt,
                current_readme: content
            });

            if (result && (result as { revised_readme?: string }).revised_readme) {
                setContent((result as { revised_readme: string }).revised_readme);
            }
        } catch (error) {
            console.error('AI edit failed:', error);
        } finally {
            setIsAIProcessing(false);
            setShowAIPrompt(false);
            setAiPrompt("");
            setSelectedText("");
        }
    };

    const handlePush = async () => {
        if (!sessionId || !repoUrl) {
            alert("No session found. Please generate documentation from the homepage first.");
            return;
        }
        setIsPublishing(true);

        try {
            // Using HMAC-authenticated API client
            const result = await api.push({
                session_id: sessionId,
                readme_content: content,
                commit_message: `docs: Update README via DocuGithub`
            });

            if (result && (result as { success?: boolean }).success) {
                setIsPublished(true);
            } else {
                throw new Error('Publish failed');
            }
        } catch (error) {
            console.error(error);
            alert("Failed to publish. Please check your token permissions.");
        } finally {
            setIsPublishing(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'README.md';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/50 to-slate-950"
        >
            {/* Animated Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px]" />
            </div>

            {/* Centered Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-screen flex flex-col">

                {/* Glassmorphism Header */}
                <motion.header
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center justify-between px-6 py-4 mb-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/20"
                >
                    <div className="flex items-center gap-4">
                        {/* Brand */}
                        <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg hover:text-indigo-400 transition-colors group">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
                                <Home className="w-4 h-4 text-indigo-400" />
                            </div>
                            <span className="hidden sm:inline">DocuGithub</span>
                        </Link>

                        <div className="h-8 w-px bg-white/10" />

                        {/* View Mode Toggle */}
                        <div className="flex bg-black/30 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                            <button
                                onClick={() => setViewMode('editor')}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all ${viewMode === 'editor'
                                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Code2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Code</span>
                            </button>
                            <button
                                onClick={() => setViewMode('split')}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-x border-white/10 transition-all ${viewMode === 'split'
                                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Columns2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Split</span>
                            </button>
                            <button
                                onClick={() => setViewMode('preview')}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all ${viewMode === 'preview'
                                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Eye className="w-4 h-4" />
                                <span className="hidden sm:inline">Preview</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            className="text-gray-400 hover:text-white hover:bg-white/10 rounded-xl"
                        >
                            <Copy className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDownload}
                            className="text-gray-400 hover:text-white hover:bg-white/10 rounded-xl"
                        >
                            <Download className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Download</span>
                        </Button>
                        <Button
                            onClick={handlePush}
                            disabled={isPublishing || isPublished}
                            className={`font-semibold rounded-xl transition-all shadow-lg ${isPublished
                                ? 'bg-green-600 hover:bg-green-600 shadow-green-500/30'
                                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30 hover:shadow-indigo-500/50'}`}
                        >
                            {isPublishing ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Pushing...</>
                            ) : isPublished ? (
                                <><CheckCircle className="w-4 h-4 mr-2" /> Published!</>
                            ) : (
                                <><Github className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Push to GitHub</span></>
                            )}
                        </Button>
                    </div>
                </motion.header>

                {/* Editor Area - Glassmorphism */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex-1 flex rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/30"
                >
                    {/* Editor Panel */}
                    <AnimatePresence mode="wait">
                        {(viewMode === 'editor' || viewMode === 'split') && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col ${viewMode === 'split' ? 'border-r border-white/10' : ''}`}
                            >
                                <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/20">
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-indigo-400" />
                                            <span className="text-sm font-medium text-white/80">README.md</span>
                                        </div>
                                    </div>
                                    {selectedText && (
                                        <Button
                                            size="sm"
                                            onClick={() => setShowAIPrompt(true)}
                                            className="gap-2 bg-indigo-500/30 border border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/40 hover:text-white rounded-lg text-xs"
                                        >
                                            <Sparkles className="w-3 h-3" /> AI Edit
                                        </Button>
                                    )}
                                </div>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    onMouseUp={handleTextSelection}
                                    className="flex-1 w-full p-6 bg-transparent font-mono text-sm text-gray-200 resize-none focus:outline-none placeholder:text-gray-600 leading-relaxed"
                                    placeholder="Start writing your documentation..."
                                    spellCheck={false}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Preview Panel */}
                    <AnimatePresence mode="wait">
                        {(viewMode === 'preview' || viewMode === 'split') && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col overflow-hidden`}
                            >
                                <div className="flex items-center px-5 py-3 border-b border-white/10 bg-black/20">
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Eye className="w-4 h-4 text-indigo-400" />
                                            <span className="text-sm font-medium text-white/80">Preview</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto p-8 bg-black/10">
                                    <article className="prose prose-invert prose-indigo max-w-none prose-headings:text-white prose-headings:font-semibold prose-p:text-gray-300 prose-a:text-indigo-400 prose-strong:text-white prose-code:text-indigo-300 prose-code:bg-indigo-950/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-pre:backdrop-blur-sm prose-li:text-gray-300 prose-li:marker:text-indigo-400">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {content}
                                        </ReactMarkdown>
                                    </article>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Status Bar */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 px-4 py-2 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm flex items-center justify-between text-xs text-gray-500"
                >
                    <div className="flex items-center gap-4">
                        <span>{content.split('\n').length} lines</span>
                        <span>{content.length} characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span>Markdown Ready</span>
                    </div>
                </motion.div>
            </div>

            {/* AI Prompt Modal */}
            <AnimatePresence>
                {showAIPrompt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowAIPrompt(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">AI Edit</h3>
                                        <p className="text-xs text-gray-500">Powered by Gemini</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAIPrompt(false)}
                                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-4 bg-black/30 rounded-xl border border-white/5 text-sm">
                                <p className="text-gray-500 mb-2 text-xs uppercase tracking-wider font-medium">Selected text:</p>
                                <p className="text-gray-300 line-clamp-3 leading-relaxed">{selectedText}</p>
                            </div>

                            <input
                                type="text"
                                placeholder="What changes would you like? (e.g., 'make it shorter', 'add examples')"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                className="w-full p-4 border border-white/10 rounded-xl bg-black/30 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleAIEdit()}
                            />

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 border-white/10 text-gray-300 hover:bg-white/5 hover:text-white rounded-xl"
                                    onClick={() => setShowAIPrompt(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"
                                    onClick={handleAIEdit}
                                    disabled={isAIProcessing || !aiPrompt}
                                >
                                    {isAIProcessing ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                                    ) : (
                                        "Apply Changes"
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
