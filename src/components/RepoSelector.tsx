import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { Loader2, Github } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

interface Repo {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
}

export default function RepoSelector() {
    const { getAccessTokenSilently } = useAuth0();
    const [repos, setRepos] = useState<Repo[]>([]);
    const [loading, setLoading] = useState(true);
    const { setRepoUrl, setSessionId, setGithubToken } = useAppStore();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRepos = async () => {
            try {
                const token = await getAccessTokenSilently();
                const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=10", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                setRepos(data);
                // Also store the token for later backend use if needed
                setGithubToken(token);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchRepos();
    }, [getAccessTokenSilently, setGithubToken]);

    const handleSelect = async (repo: Repo) => {
        setRepoUrl(repo.html_url);

        // Create session immediately
        try {
            const { data } = await supabase
                .from('documentation_sessions')
                .insert([{
                    repo_url: repo.html_url,
                    status: 'started'
                }])
                .select()
                .single();

            if (data) {
                setSessionId(data.id);
                navigate('/analysis');
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="grid gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {repos.map(repo => (
                <button
                    key={repo.id}
                    onClick={() => handleSelect(repo)}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left"
                >
                    <div className="flex items-center gap-2">
                        <Github className="h-4 w-4 opacity-70" />
                        <span className="font-medium text-sm truncate max-w-[200px]">{repo.name}</span>
                    </div>
                    {repo.private && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Private</span>}
                </button>
            ))}
        </div>
    );
}
