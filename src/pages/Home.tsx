import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import PostCard from '@/components/posts/PostCard';
import PostModal from '@/components/modals/PostModal';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, RefreshCw, Send, Image, Video } from 'lucide-react';

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

interface NewsItem {
  id: number;
  title: string;
  content: string;
}

const Home = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const fetchData = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch posts, news, and user profile in parallel
      const [postsResponse, newsResponse] = await Promise.all([
        fetch('http://localhost:9000/posts', { headers }),
        fetch('http://localhost:9000/news', { headers }),
      ]);

      const postsData = await postsResponse.json();
      const newsData = await newsResponse.json();

      if (postsData.success) {
        setPosts(postsData.data || []);
      } else {
        console.error('Failed to fetch posts:', postsData.message);
      }

      if (newsData.success) {
        setNews(newsData.data || []);
      } else {
        console.error('Failed to fetch news:', newsData.message);
      }

      // Set liked post IDs from user's likes
      if (user?.likes) {
        const likedIds = user.likes.map(like => like.postId || like.post_id).filter(Boolean);
        setLikedPostIds(likedIds);
      }

    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: "Connection Error",
        description: "Unable to load content. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    
    setIsPosting(true);
    try {
      const response = await fetch('http://localhost:9000/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newPost }),
      });

      const data = await response.json();
      if (data.success) {
        setNewPost('');
        setShowCreatePost(false);
        fetchData(false); // Refresh posts
        toast({
          title: "Post created!",
          description: "Your post has been shared with the campus community.",
        });
      } else {
        toast({
          title: "Failed to create post",
          description: data.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const isCurrentlyLiked = likedPostIds.includes(postId);
      
      // Optimistic update
      if (isCurrentlyLiked) {
        setLikedPostIds(prev => prev.filter(id => id !== postId));
      } else {
        setLikedPostIds(prev => [...prev, postId]);
      }

      const response = await fetch(`http://localhost:9000/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!data.success) {
        // Revert optimistic update on failure
        if (isCurrentlyLiked) {
          setLikedPostIds(prev => [...prev, postId]);
        } else {
          setLikedPostIds(prev => prev.filter(id => id !== postId));
        }
        toast({
          title: "Failed to update like",
          description: data.message || "Please try again.",
          variant: "destructive",
        });
      } else {
        // Refresh posts to get accurate counts
        fetchData(false);
      }
    } catch (error) {
      // Revert optimistic update on error
      const isCurrentlyLiked = likedPostIds.includes(postId);
      if (isCurrentlyLiked) {
        setLikedPostIds(prev => [...prev, postId]);
      } else {
        setLikedPostIds(prev => prev.filter(id => id !== postId));
      }
    }
  };

  const [currentModalPost, setCurrentModalPost] = useState<Post | null>(null);

  const handleComment = (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setCurrentModalPost(post);
    }
  };

  const handleOpenPost = (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setCurrentModalPost(post);
    }
  };

  const handleNavigateToProfile = (userId: number) => {
    navigate(`/profile/${userId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your campus feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-3 space-y-6">
            {/* Welcome Header */}
            <Card className="shadow-card border-0 bg-gradient-hero text-primary-foreground">
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold mb-2">
                  Welcome back, {user?.first_name}! 👋
                </h1>
                <p className="text-primary-foreground/80">
                  Stay connected with your campus community
                </p>
              </CardContent>
            </Card>

            {/* Create Post */}
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                {!showCreatePost ? (
                  <Button
                    variant="ghost"
                    className="w-full text-left justify-start text-muted-foreground hover:bg-muted"
                    onClick={() => setShowCreatePost(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    What's happening on campus?
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Share what's on your mind..."
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="resize-none border-0 focus-visible:ring-0 text-base"
                      rows={3}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" disabled>
                          <Image className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" disabled>
                          <Video className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setShowCreatePost(false);
                            setNewPost('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="hero"
                          onClick={handleCreatePost}
                          disabled={!newPost.trim() || isPosting}
                        >
                          {isPosting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          Post
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Refresh Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Campus Feed</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchData(false)}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh
              </Button>
            </div>

            {/* Posts Feed */}
            <div className="space-y-6">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={user?.id || ''}
                    likedPostIds={likedPostIds}
                    onLike={handleLike}
                    onComment={handleComment}
                    onOpenPost={handleOpenPost}
                    onNavigateToProfile={handleNavigateToProfile}
                  />
                ))
              ) : (
                <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      No posts yet. Be the first to share something with the campus community!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* News Section */}
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Campus News</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {news.length > 0 ? (
                  news.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {item.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No news available</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Your Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Posts Liked</span>
                  <span className="font-semibold">{likedPostIds.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Study Group</span>
                  <span className="font-semibold text-xs">{user?.group || 'None'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Post Modal */}
      <PostModal
        post={currentModalPost}
        isOpen={!!currentModalPost}
        onClose={() => setCurrentModalPost(null)}
        likedPostIds={likedPostIds}
        onLike={handleLike}
        onNavigateToProfile={handleNavigateToProfile}
      />
    </div>
  );
};

export default Home;