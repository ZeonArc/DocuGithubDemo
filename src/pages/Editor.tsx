import Layout from "@/components/Layout";
import AnimationLayout from "@/components/AnimationLayout";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { Save, Upload } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css"; // Import highlight styles
import { useState } from "react";

export default function Editor() {
    const { generatedDoc } = useAppStore();
    const [content, setContent] = useState(generatedDoc || "# Welcome to Editor\n\nStart typing...");

    const handlePush = () => {
        alert("Pushing to GitHub... (Mock)");
    };

    return (
        <Layout>
            <AnimationLayout>
                {/* We override Layout main container slightly for full width editor */}
                <div className="flex flex-col h-[calc(100vh-64px-100px)]"> {/* Adjust height for header/footer approx */}
                    <div className="border-b bg-background p-4 flex items-center justify-between">
                        <h2 className="font-semibold">Documentation Editor</h2>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                                <Save className="mr-2 h-4 w-4" /> Save Draft
                            </Button>
                            <Button size="sm" onClick={handlePush}>
                                <Upload className="mr-2 h-4 w-4" /> Push to GitHub
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 flex overflow-hidden">
                        {/* Editor Pane */}
                        <div className="w-1/2 border-r flex flex-col">
                            <div className="bg-muted px-4 py-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">Markdown</div>
                            <textarea
                                className="flex-1 w-full resize-none p-4 font-mono text-sm bg-background focus:outline-none"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </div>
                        {/* Preview Pane */}
                        <div className="w-1/2 flex flex-col bg-muted/10">
                            <div className="bg-muted px-4 py-2 text-xs font-mono text-muted-foreground uppercase tracking-wider border-b">Preview</div>
                            <div className="flex-1 overflow-auto p-8 prose prose-invert max-w-none">
                                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                                    {content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </div>
            </AnimationLayout>
        </Layout>
    );
}
