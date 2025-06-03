import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export interface ArtistType {
    id: number;
    name: string;
    bio: string;
    image: string | null;
    monthly_listeners?: number;
}

interface ArtistCardProps {
    artist: ArtistType;
}

const ArtistCard = ({ artist }: ArtistCardProps) => {
    return (
        <Link href={`/artists/${artist.id}`}>
            <Card className="bg-zinc-800/40 hover:bg-zinc-800/60 transition overflow-hidden border-0 h-full">
                <CardContent className="p-4 flex flex-col h-full">
                    <div className="aspect-square w-full rounded-full overflow-hidden relative mb-4 max-w-[120px] mx-auto">
                        <Image
                            src={artist.image || "/placeholder.jpg"}
                            alt="null"
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                    <div className="mt-auto">
                        <h3 className="font-medium text-white text-center truncate">
                            {artist.name}
                        </h3>
                        <p className="text-xs text-gray-400 line-clamp-2 text-center mt-1">
                            {artist.bio}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};

export default ArtistCard; 