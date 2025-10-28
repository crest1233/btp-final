import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Star, Users, TrendingUp, Bookmark, BookmarkCheck } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface CreatorCardProps {
  key?: string | number;
  creator: {
    id: string;
    name: string;
    image?: string;
    niche: string;
    followers: string;
    engagement: string;
    avgViews?: string;
    rating?: number;
    rate?: string;
  };
  onShortlist?: () => void;
  onView?: () => void;
  isShortlisted?: boolean;
}

export default function CreatorCard({ creator, onShortlist, onView, isShortlisted }: CreatorCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 bg-gradient-to-br from-purple-400 to-blue-500">
        {creator.image && (
          <ImageWithFallback
            src={creator.image}
            alt={creator.name}
            className="w-full h-full object-cover"
          />
        )}
        {onShortlist && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-3 right-3"
            onClick={(e) => {
              e.stopPropagation();
              onShortlist();
            }}
          >
            {isShortlisted ? (
              <BookmarkCheck className="w-4 h-4" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-gray-900">{creator.name}</p>
            <Badge variant="secondary" className="mt-1">
              {creator.niche}
            </Badge>
          </div>
          {creator.rating && (
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm text-gray-900">{creator.rating}</span>
            </div>
          )}
        </div>

        {(creator.followers || creator.engagement) && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {creator.followers && creator.followers !== '—' && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{creator.followers}</span>
              </div>
            )}
            {creator.engagement && creator.engagement !== '—' && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp className="w-4 h-4" />
                <span>{creator.engagement}</span>
              </div>
            )}
          </div>
        )}
 
          {creator.rate && (
          <p className="text-sm text-gray-600 mb-3">
            Rate: <span className="text-gray-900">{creator.rate}</span>
          </p>
        )}

        {onView && (
          <Button onClick={onView} className="w-full" variant="outline">
            View Profile
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
