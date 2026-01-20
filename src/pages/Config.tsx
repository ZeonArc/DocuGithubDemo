import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase";
import {
    Palette,
    FileText,
    Image as ImageIcon,
    ArrowRight,
    Loader2,
    Plus,
    X,
    CheckCircle
} from "lucide-react";

const STYLE_OPTIONS = [
    { id: 'simple', label: 'Simple', description: 'Compact, minimal documentation' },
    { id: 'detailed', label: 'Detailed', description: 'Comprehensive with examples' },
    { id: 'vibrant', label: 'Vibrant', description: 'Dynamic with badges and visuals' },
];

const DEFAULT_TOPICS = [
    'Getting Started',
    'Installation',
    'Usage',
    'API Reference',
    'Configuration',
    'Contributing',
    'License'
];

export default function Config() {
    const navigate = useNavigate();
    const { sessionId, setDocStyle, setTopics: setStoreTopics, docStyle } = useAppStore();
    const [selectedStyle, setSelectedStyle] = useState<'simple' | 'detailed'>(docStyle || 'detailed');
    const [topics, setTopics] = useState<string[]>(DEFAULT_TOPICS.slice(0, 5));
    const [customTopic, setCustomTopic] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [imageUrl, setImageUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const addTopic = () => {
        if (customTopic && !topics.includes(customTopic)) {
            setTopics([...topics, customTopic]);
            setCustomTopic("");
        }
    };

    const removeTopic = (topic: string) => {
        setTopics(topics.filter(t => t !== topic));
    };

    const addImage = () => {
        if (imageUrl && !images.includes(imageUrl)) {
            setImages([...images, imageUrl]);
            setImageUrl("");
        }
    };

    const removeImage = (url: string) => {
        setImages(images.filter(i => i !== url));
    };

    const handleSubmit = async () => {
        if (!sessionId) return;

        setIsLoading(true);
        setDocStyle(selectedStyle);
        setStoreTopics(topics);

        try {
            // Save config to Supabase
            await supabase
                .from('user_configs')
                .upsert([{
                    session_id: sessionId,
                    style: selectedStyle,
                    topics: topics,
                    images: images
                }], { onConflict: 'session_id' });

            // Update session status
            await supabase
                .from('documentation_sessions')
                .update({ status: 'configuring' })
                .eq('id', sessionId);

            navigate('/generating');
        } catch (error) {
            console.error('Failed to save config:', error);
            navigate('/generating');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 py-12">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">Configure Documentation</h1>
                    <p className="text-muted-foreground">
                        Customize how your documentation will be generated
                    </p>
                </div>

                {/* Style Selection */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Palette className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Style</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {STYLE_OPTIONS.map((style) => (
                            <button
                                key={style.id}
                                onClick={() => setSelectedStyle(style.id as typeof selectedStyle)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${selectedStyle === style.id
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold">{style.label}</span>
                                    {selectedStyle === style.id && (
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">{style.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Topics */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Topics</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {topics.map((topic) => (
                            <span
                                key={topic}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
                            >
                                {topic}
                                <button onClick={() => removeTopic(topic)} className="hover:text-red-400">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Add custom topic..."
                            value={customTopic}
                            onChange={(e) => setCustomTopic(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                        />
                        <Button variant="outline" onClick={addTopic}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {DEFAULT_TOPICS.filter(t => !topics.includes(t)).map((topic) => (
                            <button
                                key={topic}
                                onClick={() => setTopics([...topics, topic])}
                                className="px-3 py-1.5 border border-dashed border-border text-muted-foreground rounded-full text-sm hover:border-primary hover:text-primary transition-colors"
                            >
                                + {topic}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reference Images */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Reference Images (Optional)</h2>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="https://example.com/image.png"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addImage()}
                        />
                        <Button variant="outline" onClick={addImage}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    {images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {images.map((url, idx) => (
                                <div key={idx} className="relative group">
                                    <img
                                        src={url}
                                        alt={`Reference ${idx + 1}`}
                                        className="w-full h-24 object-cover rounded-lg border"
                                        onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x100?text=Invalid+URL'}
                                    />
                                    <button
                                        onClick={() => removeImage(url)}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Button onClick={handleSubmit} className="w-full h-12" disabled={isLoading}>
                    {isLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                        <>Generate Documentation <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                </Button>
            </div>
        </div>
    );
}
