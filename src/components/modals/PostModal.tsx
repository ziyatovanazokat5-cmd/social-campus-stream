import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Eye, Send, Loader2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: number;
  text: string;
  user: {
    id: number;
    username: string;
    first_name: string;
    profilePhoto?: { url: string };
  };
  createdAt?: string;
}

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
  comments: Comment[];
  views: number;
  createdAt: string;
}

interface PostModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  likedPostIds: number[];
  onLike: (postId: number) => void;
  onNavigateToProfile: (userId: number) => void;
}

const PostModal: React.FC<PostModalProps> = ({
  post,
  isOpen,
  onClose,
  likedPostIds,
  onLike,
  onNavigateToProfile
}) => {
  const { user, token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const normalizeUrl = (url: string) => {
    if (url?.startsWith('./')) {
      return `http://localhost:9000/${url.slice(2)}`;
    }
    return url?.startsWith('http') ? url : `http://localhost:9000/${url}`;
  };

  const fetchComments = async (postId: number) => {
    setIsLoadingComments(true);
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setComments(data.data.comments || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !post) return;

    setIsPosting(true);
    try {
      const response = await fetch(`/api/comments/${post.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newComment }),
      });

      const data = await response.json();
      if (data.success) {
        // Optimistically add comment
        const newCommentObj: Comment = {
          id: Date.now(), // Temporary ID
          text: newComment,
          user: {
            id: parseInt(user?.id || '0'),
            username: user?.username || '',
            first_name: user?.first_name || '',
            profilePhoto: user?.profilePhoto,
          },
          createdAt: new Date().toISOString(),
        };
        setComments(prev => [...prev, newCommentObj]);
        setNewComment('');
        
        toast({
          title: "Comment posted!",
          description: "Your comment has been added.",
        });
      } else {
        toast({
          title: "Failed to post comment",
          description: data.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to post comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  useEffect(() => {
    if (post && isOpen) {
      setComments(post.comments || []);
      fetchComments(post.id);
      setCurrentMediaIndex(0);
    }
  }, [post, isOpen]);

  if (!post) return null;

  const isLiked = likedPostIds.includes(post.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-card/95 backdrop-blur-lg border-0 shadow-2xl">
        <div className="flex h-full">
          {/* Media Section */}
          {post.media && post.media.length > 0 && (
            <div className="flex-1 relative bg-black rounded-l-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
              
              <div className="relative h-full min-h-[400px]">
                {post.media[currentMediaIndex].type === 'image' ? (
                  <img
                    src={normalizeUrl(post.media[currentMediaIndex].url)}
                    alt="Post media"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    src={normalizeUrl(post.media[currentMediaIndex].url)}
                    className="w-full h-full object-contain"
                    controls
                  />
                )}

                {/* Media Navigation */}
                {post.media.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {post.media.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentMediaIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentMediaIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content Section */}
          <div className="flex-1 flex flex-col min-w-[400px]">
            <DialogHeader className="p-6 border-b border-border">
              <div className="flex items-center space-x-3">
                <Avatar 
                  className="w-12 h-12 ring-2 ring-primary/20 cursor-pointer"
                  onClick={() => onNavigateToProfile(post.author.id)}
                >
                  <AvatarImage src={normalizeUrl(post.author.profilePhoto.url)} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                    {post.author.first_name[0]}{post.author.second_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div 
                  className="cursor-pointer"
                  onClick={() => onNavigateToProfile(post.author.id)}
                >
                  <DialogTitle className="text-lg hover:text-primary transition-colors">
                    {post.author.first_name} {post.author.second_name}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    @{post.author.username} • {formatDistanceToNow(new Date(post.createdAt))} ago
                  </p>
                </div>
              </div>
            </DialogHeader>

            {/* Post Content */}
            <div className="p-6 border-b border-border">
              <p className="text-foreground leading-relaxed">{post.content}</p>
            </div>

            {/* Post Actions */}
            <div className="px-6 py-4 border-b border-border">
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
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="ml-2">{post.likes?.length || 0} likes</span>
                </Button>

                <div className="flex items-center space-x-2 text-muted-foreground">
                  <MessageCircle className="w-5 h-5" />
                  <span>{comments.length} comments</span>
                </div>

                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Eye className="w-5 h-5" />
                  <span>{post.views || 0} views</span>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <ScrollArea className="flex-1 p-6">
              {isLoadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start space-x-3">
                      <Avatar 
                        className="w-8 h-8 cursor-pointer"
                        onClick={() => onNavigateToProfile(comment.user.id)}
                      >
                        <AvatarImage src={comment.user.profilePhoto ? normalizeUrl(comment.user.profilePhoto.url) : undefined} />
                        <AvatarFallback className="text-xs">
                          {comment.user.first_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-muted rounded-lg p-3">
                          <p 
                            className="font-medium text-sm cursor-pointer hover:text-primary transition-colors"
                            onClick={() => onNavigateToProfile(comment.user.id)}
                          >
                            {comment.user.first_name}
                          </p>
                          <p className="text-sm text-foreground mt-1">{comment.text}</p>
                        </div>
                        {comment.createdAt && (
                          <p className="text-xs text-muted-foreground mt-1 ml-3">
                            {formatDistanceToNow(new Date(comment.createdAt))} ago
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
                </div>
              )}
            </ScrollArea>

            {/* Comment Input */}
            <div className="p-6 border-t border-border">
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.profilePhoto ? normalizeUrl(user.profilePhoto.url) : undefined} />
                  <AvatarFallback className="text-xs">
                    {user?.first_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex space-x-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handlePostComment}
                    disabled={!newComment.trim() || isPosting}
                    size="icon"
                    variant="hero"
                  >
                    {isPosting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostModal;