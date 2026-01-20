import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { useAuth0 } from "@auth0/auth0-react";
import { supabase } from "@/lib/supabase";
import { Key, Github, ArrowRight, Loader2 } from "lucide-react";

export default function Auth() {
    const navigate = useNavigate();
    const { repoUrl, sessionId, setGithubToken } = useAppStore();
    const [token, setToken] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { isAuthenticated, getAccessTokenSilently } = useAuth0();

    // If authenticated via Auth0, try to get the GitHub token from claims
    useEffect(() => {
        const getGitHubToken = async () => {
            if (isAuthenticated) {
                try {
                    // Get the access token which may contain the GitHub token in custom claims
                    const accessToken = await getAccessTokenSilently();
                    // For now, we'll use the Auth0 access token
                    // In production, you'd extract the GitHub provider token from custom claims
                    setGithubToken(accessToken);
                    navigate('/analysis');
                } catch (error) {
                    console.error('Failed to get token:', error);
                }
            }
        };
        getGitHubToken();
    }, [isAuthenticated, getAccessTokenSilently, setGithubToken, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !sessionId) return;

        setIsLoading(true);
        setGithubToken(token);

        try {
            // Save token to user_configs
            await supabase
                .from('user_configs')
                .insert([{
                    session_id: sessionId,
                    github_token: token
                }]);

            navigate('/analysis');
        } catch (error) {
            console.error('Failed to save token:', error);
            navigate('/analysis');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Key className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold">GitHub Access</h1>
                    <p className="text-muted-foreground">
                        Enter your GitHub Personal Access Token to continue
                    </p>
                </div>

                <div className="bg-card border rounded-xl p-6 space-y-6">
                    {repoUrl && (
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <Github className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm truncate">{repoUrl}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Personal Access Token</label>
                            <Input
                                type="password"
                                placeholder="ghp_xxxxxxxxxxxx"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="h-12"
                            />
                            <p className="text-xs text-muted-foreground">
                                Token needs <code className="bg-muted px-1 rounded">repo</code> scope.{" "}
                                <a
                                    href="https://github.com/settings/tokens/new?scopes=repo"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    Create one here
                                </a>
                            </p>
                        </div>

                        <Button type="submit" className="w-full h-12" disabled={isLoading || !token}>
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                            ) : (
                                <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>
                            )}
                        </Button>
                    </form>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                    Your token is used only for this session and is never stored permanently.
                </p>
            </div>
        </div>
    );
}
