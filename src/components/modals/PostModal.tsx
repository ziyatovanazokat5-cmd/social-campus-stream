import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Eye, Send, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: number;
  text: string;
  author: {
    id: number;
    username: string;
    first_name: string;
    second_name?: string;
    profilePhoto?: { url: string } | null;
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
    profilePhoto: { url: string } | null;
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
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const normalizeUrl = (url: string) => {
    if (url?.startsWith('./')) {
      return `http://localhost:9000/${url.slice(2)}`;
    }
    return url?.startsWith('http') ? url : `http://localhost:9000/${url}`;
  };

  const fetchComments = async (postId: number) => {
    setIsLoadingComments(true);
    try {
      const response = await fetch(`http://localhost:9000/posts/${postId}`, {
        headers: {
          'Authorization': `${token}`,
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
      const response = await fetch(`http://localhost:9000/comments/${post.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newComment }),
      });

      const data = await response.json();
      if (data.success) {
        const newCommentObj: Comment = {
          id: Date.now(),
          text: newComment,
          author: {
            id: parseInt(user?.id || '0'),
            username: user?.username || '',
            first_name: user?.first_name || '',
            second_name: user?.second_name || '',
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

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe && post.media.length > 1) {
      setCurrentMediaIndex((prev) => (prev + 1) % post.media.length);
    } else if (isRightSwipe && post.media.length > 1) {
      setCurrentMediaIndex((prev) => (prev - 1 + post.media.length) % post.media.length);
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
      <DialogContent className="w-[90vw] max-w-[800px] h-[80vh] max-h-[600px] p-0 bg-card/95 backdrop-blur-lg border-0 shadow-2xl rounded-xl overflow-hidden">
        <div className="flex h-full">
          {post.media && post.media.length > 0 && (
            <div className="flex-1 relative bg-black rounded-l-xl">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
              
              <div 
                className="relative h-full flex items-center justify-center"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {post.media[currentMediaIndex].type === 'image' ? (
                  <img
                    src={normalizeUrl(post.media[currentMediaIndex].url)}
                    alt="Post media"
                    className="w-full h-full object-contain max-w-[90%] max-h-[90%] rounded-lg"
                  />
                ) : (
                  <video
                    src={normalizeUrl(post.media[currentMediaIndex].url)}
                    className="w-full h-full object-contain max-w-[90%] max-h-[90%] rounded-lg"
                    controls
                  />
                )}

                {post.media.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 left-2 transform -translate-y-1/2 text-white hover:bg-white/20 rounded-full"
                      onClick={() => setCurrentMediaIndex((prev) => (prev - 1 + post.media.length) % post.media.length)}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 right-2 transform -translate-y-1/2 text-white hover:bg-white/20 rounded-full"
                      onClick={() => setCurrentMediaIndex((prev) => (prev + 1) % post.media.length)}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {post.media.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentMediaIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentMediaIndex ? 'bg-white scale-125' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col min-w-[280px]">
            <DialogHeader className="p-4 border-b border-border">
              <div className="flex items-center space-x-2">
                <Avatar 
                  className="w-10 h-10 ring-2 ring-primary/20 cursor-pointer"
                  onClick={() => onNavigateToProfile(post.author.id)}
                >
                  <AvatarImage src={post.author.profilePhoto?.url ? normalizeUrl(post.author.profilePhoto.url) : undefined} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                    {post.author.first_name[0]}{post.author.second_name?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
                <div 
                  className="cursor-pointer"
                  onClick={() => onNavigateToProfile(post.author.id)}
                >
                  <DialogTitle className="text-base hover:text-primary transition-colors">
                    {post.author.first_name} {post.author.second_name}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground">
                    @{post.author.username} • {formatDistanceToNow(new Date(post.createdAt))} ago
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="p-4 border-b border-border">
              <p className="text-foreground text-sm leading-relaxed">{post.content}</p>
            </div>

            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center space-x-4">
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
                  <span className="ml-1 text-xs">{post.likes?.length || 0} likes</span>
                </Button>

                <div className="flex items-center space-x-1 text-muted-foreground">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs">{comments.length} comments</span>
                </div>

                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs">{post.views || 0} views</span>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4 max-h-[calc(80vh-220px)]">
              {isLoadingComments ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start space-x-2">
                      <Avatar 
                        className="w-7 h-7 cursor-pointer"
                        onClick={() => onNavigateToProfile(comment.author.id)}
                      >
                        <AvatarImage src={comment.author.profilePhoto?.url ? normalizeUrl(comment.author.profilePhoto.url) : undefined} />
                        <AvatarFallback className="text-xs">
                          {comment.author.first_name[0]}{comment.author.second_name?.[0] || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-muted rounded-lg p-2">
                          <p 
                            className="font-medium text-xs cursor-pointer hover:text-primary transition-colors"
                            onClick={() => onNavigateToProfile(comment.author.id)}
                          >
                            {comment.author.first_name} {comment.author.second_name || ''}
                          </p>
                          <p className="text-xs text-foreground mt-1">{comment.text}</p>
                        </div>
                        {comment.createdAt && (
                          <p className="text-xs text-muted-foreground mt-1 ml-2">
                            {formatDistanceToNow(new Date(comment.createdAt))} ago
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No comments yet. Be the first to comment!</p>
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t border-border bg-card sticky bottom-0">
              <div className="flex items-center space-x-2">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={user?.profilePhoto?.url ? normalizeUrl(user.profilePhoto.url) : undefined} />
                  <AvatarFallback className="text-xs">
                    {user?.first_name?.[0]}{user?.second_name?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex space-x-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                    className="flex-1 text-sm"
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