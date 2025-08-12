import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Eye, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: number;
  author: {
    id: number;
    first_name: string;
    second_name: string;
    username: string;
    profilePhoto: { url: string };
  };
  content: string;
  media: Array<{
    type: 'image' | 'video';
    url: string;
  }>;
  likes: any[];
  comments: Array<{
    id: number;
    text: string;
    user: {
      id: number;
      username: string;
      first_name: string;
    };
  }>;
  views: number;
  createdAt: string;
}

interface PostCardProps {
  post: Post;
  currentUserId: string;
  likedPostIds: number[];
  onLike: (postId: number) => void;
  onComment: (postId: number) => void;
  onOpenPost: (postId: number) => void;
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  currentUserId, 
  likedPostIds, 
  onLike, 
  onComment, 
  onOpenPost 
}) => {
  const [imageError, setImageError] = useState<{[key: string]: boolean}>({});
  
  const isLiked = likedPostIds.includes(post.id);
  const normalizeUrl = (url: string) => {
    if (url.startsWith('./')) {
      return `http://localhost:9000/${url.slice(2)}`;
    }
    return url.startsWith('http') ? url : `http://localhost:9000/${url}`;
  };

  const handleImageError = (url: string) => {
    setImageError(prev => ({ ...prev, [url]: true }));
  };

  return (
    <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm hover:shadow-elegant transition-all duration-300 animate-fade-in">
      <CardContent className="p-6 space-y-4">
        {/* Post Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12 ring-2 ring-primary/20">
              <AvatarImage 
                src={normalizeUrl(post.author.profilePhoto.url)} 
                alt={post.author.username}
              />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                {post.author.first_name[0]}{post.author.second_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">
                {post.author.first_name} {post.author.second_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                @{post.author.username} • {formatDistanceToNow(new Date(post.createdAt))} ago
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>

        {/* Post Content */}
        <div className="space-y-4">
          <p className="text-foreground leading-relaxed">{post.content}</p>

          {/* Media */}
          {post.media && post.media.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {post.media.map((media, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden">
                  {media.type === 'image' && !imageError[media.url] ? (
                    <img
                      src={normalizeUrl(media.url)}
                      alt="Post media"
                      className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                      onError={() => handleImageError(media.url)}
                    />
                  ) : media.type === 'video' ? (
                    <video
                      src={normalizeUrl(media.url)}
                      className="w-full h-48 object-cover"
                      controls
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">Media unavailable</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comments Preview */}
        {post.comments && post.comments.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground">Recent comments:</p>
            {post.comments.slice(0, 3).map((comment) => (
              <div key={comment.id} className="flex items-start space-x-2">
                <span className="text-sm font-medium text-primary">
                  {comment.user.first_name}:
                </span>
                <span className="text-sm text-foreground">{comment.text}</span>
              </div>
            ))}
            {post.comments.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenPost(post.id)}
                className="text-primary hover:text-primary/80 p-0 h-auto font-normal"
              >
                View all {post.comments.length} comments
              </Button>
            )}
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(post.id)}
              className={`transition-all duration-300 ${
                isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-muted-foreground hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="ml-1">{post.likes?.length || 0}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onComment(post.id)}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="ml-1">{post.comments?.length || 0}</span>
            </Button>

            <div className="flex items-center space-x-1 text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span className="text-sm">{post.views || 0}</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenPost(post.id)}
            className="transition-all duration-300"
          >
            Open
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;