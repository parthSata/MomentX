import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/navigation/MainLayout";
import { api } from "@/lib/axios";
import { ReelCard } from "@/components/reels/ReelCard";
import type { Reel } from "@/components/reels/ReelCard";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SingleReelPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [reel, setReel] = useState<Reel | null>(null);
    const [loading, setLoading] = useState(true);
    const [muted, setMuted] = useState(false);

    useEffect(() => {
        const fetchReel = async () => {
            if (!id) return;
            try {
                const { data } = await api.get(`/posts/${id}`);
                setReel(data.data || data);
            } catch (error) {
                console.error("Failed to fetch reel", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReel();
    }, [id]);

    if (loading) return (
        <MainLayout>
            <div className="flex h-[80vh] items-center justify-center bg-black">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        </MainLayout>
    );

    if (!reel) return (
        <MainLayout>
            <div className="flex flex-col h-[80vh] items-center justify-center gap-4 bg-black text-white">
                <p className="opacity-50 font-black uppercase tracking-widest text-xs">Signal Lost: Reel Unavailable</p>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => navigate("/")}>Return home</Button>
            </div>
        </MainLayout>
    );

    return (
        <MainLayout>
            <div className="relative h-[calc(100vh-120px)] sm:h-[calc(100vh-40px)] w-full flex flex-col bg-black overflow-hidden sm:rounded-2xl">
                <div className="absolute top-4 left-4 z-50 flex items-center gap-4 pointer-events-none">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10 hover:bg-black/40 pointer-events-auto" 
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-xl font-display font-bold text-white drop-shadow-lg italic uppercase tracking-tighter">
                        Single <span className="gradient-text">Capture</span>
                    </h1>
                </div>
                
                <div className="flex-1 w-full h-full">
                    <ReelCard 
                        reel={reel} 
                        isActive={true} 
                        muted={muted} 
                        onToggleMute={() => setMuted(!muted)} 
                    />
                </div>
            </div>
        </MainLayout>
    );
}
