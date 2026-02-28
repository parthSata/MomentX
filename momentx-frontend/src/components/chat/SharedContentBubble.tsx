import { Play, Image as ImageIcon } from "lucide-react";
import { AvatarRing } from "@/components/ui/avatar-ring";

export interface SharedContent {
    type: "reel" | "post";
    postId: string;
    username: string;
    userAvatar: string;
    thumbnail: string;
    caption?: string;
}

interface SharedContentBubbleProps {
    content: SharedContent;
    onClick: () => void;
}

export function SharedContentBubble({ content, onClick }: SharedContentBubbleProps) {
    return (
        <div
            onClick={onClick}
            className="w-55 overflow-hidden rounded-2xl bg-black/40 border border-white/10 cursor-pointer hover:opacity-90 transition-opacity"
        >
            {/* Thumbnail */}
            <div className="relative aspect-3/4 w-full overflow-hidden bg-black/20">
                <img
                    src={content.thumbnail}
                    alt="Shared content"
                    className="w-full h-full object-cover"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/40" />

                {/* Type badge */}
                <div className="absolute top-2 right-2">
                    {content.type === "reel" ? (
                        <div className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm">
                            <Play className="w-3.5 h-3.5 text-white fill-white" />
                        </div>
                    ) : (
                        <div className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm">
                            <ImageIcon className="w-3.5 h-3.5 text-white" />
                        </div>
                    )}
                </div>

                {/* User info overlay */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <AvatarRing src={content.userAvatar || "/default-avatar.png"} size="sm" />
                    <span className="text-white text-xs font-semibold drop-shadow-lg">
                        {content.username}
                    </span>
                </div>

                {/* Caption overlay */}
                {/* {content.caption && (
                    <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-[11px] leading-tight line-clamp-2 drop-shadow-lg font-medium">
                            {content.caption}
                        </p>
                    </div>
                )} */}
            </div>

            {/* Footer Banner */}
            {/* <div className="p-2 text-center text-[10px] text-white/70 font-semibold bg-black/20 backdrop-blur-md uppercase tracking-wider">
                View {content.type}
            </div> */}
        </div>
    );
}