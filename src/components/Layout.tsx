import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Background } from "@/components/Background";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { motion } from "framer-motion";
import { Github, Twitter, Linkedin } from "lucide-react";

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {

    return (
        <>
            <Background />
            <div className="flex min-h-screen flex-col relative z-0">
                {/* Floating Navbar Island */}
                <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
                    <motion.header
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                        className="pointer-events-auto flex items-center justify-between w-full max-w-5xl h-14 rounded-full border border-border/40 bg-background/60 backdrop-blur-xl shadow-lg px-6"
                    >
                        {/* Brand */}
                        <Link to="/" className="flex items-center space-x-2 group">
                            <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/50">
                                DocuGithub
                            </span>
                        </Link>

                        {/* Center Nav - Visible on Desktop */}
                        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-muted-foreground">
                            <Link to="/" className="hover:text-foreground transition-colors relative group">
                                Home
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-foreground transition-all group-hover:w-full" />
                            </Link>
                            <Link to="/docs" className="hover:text-foreground transition-colors">Docs</Link>
                            <Link to="/editor" className="hover:text-foreground transition-colors">Editor</Link>
                            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
                        </nav>

                        {/* Right Actions */}
                        <div className="flex items-center space-x-4">
                            <ThemeSwitcher />
                        </div>
                    </motion.header>
                </div>

                {/* Main Content */}
                <main className="flex-1 relative pt-24">
                    {children}
                </main>

                {/* Footer */}
                <footer className="border-t border-border/20 bg-background/60 backdrop-blur-md pt-12 pb-8 mt-20">
                    <div className="container px-4 md:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                            <div className="md:col-span-1 space-y-4">
                                <div className="flex items-center space-x-2">
                                    <span className="font-bold text-foreground">DocuGithub</span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Automated documentation generation for modern developers. Powered by Gemini AI.
                                </p>
                                <div className="flex items-center space-x-4">
                                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Twitter className="h-4 w-4" /></a>
                                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Linkedin className="h-4 w-4" /></a>
                                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Github className="h-4 w-4" /></a>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-4 text-sm text-foreground">Product</h3>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li><Link to="/docs" className="hover:text-foreground transition-colors">How It Works</Link></li>
                                    <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">GitHub</a></li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-4 text-sm text-foreground">Resources</h3>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li><Link to="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
                                    <li><a href="https://n8n.io" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">n8n Workflows</a></li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-4 text-sm text-foreground">Connect</h3>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">GitHub</a></li>
                                    <li><a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Twitter</a></li>
                                </ul>
                            </div>
                        </div>

                        <div className="border-t border-border/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                            <p className="text-xs text-muted-foreground">© 2026 DocuGithub. All rights reserved.</p>
                            <p className="text-xs text-muted-foreground">
                                Made with ❤️ by <span className="font-semibold text-foreground">ZeonArc</span> and <span className="font-semibold text-foreground">DarkPhoenix</span>
                            </p>
                        </div>
                    </div>
                </footer>
            </div >
        </>
    );
}
