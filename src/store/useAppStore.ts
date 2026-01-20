import { create } from 'zustand';

interface AppState {
    repoUrl: string;
    githubToken: string;
    docStyle: 'simple' | 'detailed';
    topics: string[];
    generatedDoc: string;

    setRepoUrl: (url: string) => void;
    setGithubToken: (token: string) => void;
    setDocStyle: (style: 'simple' | 'detailed') => void;
    setTopics: (topics: string[]) => void;
    setGeneratedDoc: (doc: string) => void;
    themeVariant: 'cosmic' | 'sunset';
    setThemeVariant: (variant: 'cosmic' | 'sunset') => void;

    sessionId: string | null;
    setSessionId: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
    repoUrl: '',
    githubToken: '',
    docStyle: 'detailed',
    topics: ['Quick Start', 'Installation'],
    generatedDoc: '',

    setRepoUrl: (url) => set({ repoUrl: url }),
    setGithubToken: (token) => set({ githubToken: token }),
    setDocStyle: (style) => set({ docStyle: style }),
    setTopics: (topics) => set({ topics }),
    setGeneratedDoc: (doc) => set({ generatedDoc: doc }),
    themeVariant: 'cosmic',
    setThemeVariant: (variant) => set({ themeVariant: variant }),

    sessionId: null,
    setSessionId: (id) => set({ sessionId: id }),
}));
