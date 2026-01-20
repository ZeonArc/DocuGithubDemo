import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import {
    Github,
    Eye,
    Code2,
    Loader2,
    CheckCircle,
    Sparkles,
    Copy,
    Download,
    ArrowLeft
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Editor() {
    const navigate = useNavigate();
    const { generatedDoc, sessionId, repoUrl, githubToken } = useAppStore();
    const [content, setContent] = useState(generatedDoc || "# Welcome to Editor\n\nStart typing...");
    const [isPublishing, setIsPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [selectedText, setSelectedText] = useState("");
    const [showAIPrompt, setShowAIPrompt] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isAIProcessing, setIsAIProcessing] = useState(false);
    const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');

    useEffect(() => {
        if (generatedDoc) {
            setContent(generatedDoc);
        }
    }, [generatedDoc]);

    const handleTextSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
            setSelectedText(selection.toString());
            setShowAIPrompt(true);
        }
    };

    const handleAIEdit = async () => {
        if (!selectedText || !aiPrompt) return;

        setIsAIProcessing(true);
        try {
            // Call AI endpoint for inline edit
            const webhookBase = import.meta.env.VITE_N8N_WEBHOOK_BASE;
            const response = await fetch(`${webhookBase}/ai-edit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selectedText,
                    instruction: aiPrompt,
                    context: content
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.editedText) {
                    setContent(content.replace(selectedText, result.editedText));
                }
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
        if (!sessionId || !repoUrl) return;
        setIsPublishing(true);

        try {
            const webhookBase = import.meta.env.VITE_N8N_WEBHOOK_BASE;
            const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            const owner = match?.[1] || '';
            const repo = match?.[2]?.replace(/\.git$/, '') || '';

            const response = await fetch(`${webhookBase}/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    owner,
                    repo,
                    content,
                    githubToken
                })
            });

            if (response.ok) {
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
        <div className="h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b bg-card">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/config')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <div className="h-6 w-px bg-border" />
                    <div className="flex items-center gap-2">
                        <div className="flex border rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode('editor')}
                                className={`px-3 py-1.5 text-sm ${viewMode === 'editor' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                            >
                                <Code2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('split')}
                                className={`px-3 py-1.5 text-sm border-x ${viewMode === 'split' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                            >
                                Split
                            </button>
                            <button
                                onClick={() => setViewMode('preview')}
                                className={`px-3 py-1.5 text-sm ${viewMode === 'preview' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                        <Copy className="w-4 h-4 mr-2" /> Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-2" /> Download
                    </Button>
                    <Button
                        onClick={handlePush}
                        disabled={isPublishing || isPublished}
                        className={isPublished ? 'bg-green-600 hover:bg-green-600' : ''}
                    >
                        {isPublishing ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Pushing...</>
                        ) : isPublished ? (
                            <><CheckCircle className="w-4 h-4 mr-2" /> Published!</>
                        ) : (
                            <><Github className="w-4 h-4 mr-2" /> Push to GitHub</>
                        )}
                    </Button>
                </div>
            </header>

            {/* Editor Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Editor Panel */}
                {(viewMode === 'editor' || viewMode === 'split') && (
                    <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col border-r`}>
                        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
                            <span className="text-sm font-medium">README.md</span>
                            {selectedText && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowAIPrompt(true)}
                                    className="gap-2"
                                >
                                    <Sparkles className="w-3 h-3" /> AI Edit
                                </Button>
                            )}
                        </div>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onMouseUp={handleTextSelection}
                            className="flex-1 w-full p-4 bg-background font-mono text-sm resize-none focus:outline-none"
                            placeholder="Start writing your documentation..."
                        />
                    </div>
                )}

                {/* Preview Panel */}
                {(viewMode === 'preview' || viewMode === 'split') && (
                    <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col overflow-hidden`}>
                        <div className="flex items-center px-4 py-2 border-b bg-muted/50">
                            <span className="text-sm font-medium">Preview</span>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            <article className="prose prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {content}
                                </ReactMarkdown>
                            </article>
                        </div>
                    </div>
                )}
            </div>

            {/* AI Prompt Modal */}
            {showAIPrompt && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border rounded-xl p-6 w-full max-w-md space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">AI Edit</h3>
                        </div>
                        <div className="p-3 bg-muted rounded-lg text-sm">
                            <p className="text-muted-foreground mb-1">Selected text:</p>
                            <p className="line-clamp-3">{selectedText}</p>
                        </div>
                        <input
                            type="text"
                            placeholder="What changes would you like? (e.g., 'make it shorter', 'add examples')"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="w-full p-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setShowAIPrompt(false)}>
                                Cancel
                            </Button>
                            <Button className="flex-1" onClick={handleAIEdit} disabled={isAIProcessing || !aiPrompt}>
                                {isAIProcessing ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                                ) : (
                                    "Apply Changes"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
