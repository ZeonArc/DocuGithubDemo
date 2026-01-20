import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase";
import { Loader2, Github } from "lucide-react";

/**
 * RepoInit - Handles URL-based repository initialization
 * Route: /:owner/:repo
 * Example: docugithub.com/facebook/react
 */
export default function RepoInit() {
    const { owner, repo } = useParams<{ owner: string; repo: string }>();
    const navigate = useNavigate();
    const { setRepoUrl, setSessionId } = useAppStore();

    useEffect(() => {
        const initSession = async () => {
            if (!owner || !repo) {
                navigate('/');
                return;
            }

            const repoUrl = `https://github.com/${owner}/${repo}`;
            setRepoUrl(repoUrl);

            try {
                // Create session in Supabase
                const { data, error } = await supabase
                    .from('documentation_sessions')
                    .insert([{
                        repo_url: repoUrl,
                        owner: owner,
                        repo: repo,
                        status: 'started'
                    }])
                    .select()
                    .single();

                if (error) throw error;

                if (data) {
                    setSessionId(data.id);
                    // Navigate to auth page to get GitHub token
                    navigate('/auth');
                }
            } catch (error) {
                console.error('Failed to create session:', error);
                navigate('/');
            }
        };

        initSession();
    }, [owner, repo, navigate, setRepoUrl, setSessionId]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background">
            <div className="text-center space-y-6">
                <div className="relative">
                    <Github className="w-16 h-16 mx-auto text-primary animate-pulse" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">Initializing Repository</h1>
                    <p className="text-muted-foreground">
                        {owner}/{repo}
                    </p>
                </div>
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" />
            </div>
        </div>
    );
}
