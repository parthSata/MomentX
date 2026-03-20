import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/navigation/MainLayout";
import { api } from "@/lib/axios";
import { PostCard } from "@/components/feed/PostCard";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SinglePostPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            if (!id) return;
            try {
                const { data } = await api.get(`/posts/${id}`);
                setPost(data.data || data);
            } catch (error) {
                console.error("Failed to fetch post", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [id]);

    if (loading) return (
        <MainLayout>
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        </MainLayout>
    );

    if (!post) return (
        <MainLayout>
            <div className="flex flex-col h-[80vh] items-center justify-center gap-4">
                <p className="text-muted-foreground">Post not found or unavailable.</p>
                <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
            </div>
        </MainLayout>
    );

    return (
        <MainLayout>
            <div className="max-w-xl mx-auto py-4 md:py-8 px-2 md:px-4">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-xl font-bold">Post</h1>
                </div>
                <PostCard post={post} />
            </div>
        </MainLayout>
    );
}
