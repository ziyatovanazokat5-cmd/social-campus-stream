/* src/pages/Home.tsx */
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import PostCard from '@/components/posts/PostCard';
import PostModal from '@/components/modals/PostModal';
import NewsModal from '@/components/modals/NewsModal';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, RefreshCw, Send, Image, Video } from 'lucide-react';

interface Post {
  id: number;
  author: {
    id: string;
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
  likes: Array<{
    id?: number;
    user: { id: string };
  }>;
  comments: Array<{
    id: number;
    text: string;
    author: { id: string; username: string; first_name: string };
  }>;
  views: number;
  createdAt: string;
}

interface NewsItem {
  id: number;
  title: string;
  content: string;
  media?: Array<{ type: 'image' | 'video'; url: string }>;
}

const Home = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]); // For preview URLs
  const [isPosting, setIsPosting] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [currentModalPost, setCurrentModalPost] = useState<Post | null>(null);
  const [currentNews, setCurrentNews] = useState<NewsItem | null>(null);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const likedPostIds = posts
    .filter((p) => p.likes.some((l) => l.user.id === user?.id))
    .map((p) => p.id);

  const fetchData = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const headers = { Authorization: `${token}`, 'Content-Type': 'application/json' };
      const [postsRes, newsRes] = await Promise.all([
        fetch('http://localhost:9000/posts', { headers }),
        fetch('http://localhost:9000/news', { headers }),
      ]);

      const postsData = await postsRes.json();
      const newsData = await newsRes.json();

      if (postsData.success) setPosts(postsData.data || []);
      if (newsData.success) setNews(newsData.data || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load content.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchNewsById = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:9000/news/${id}`, {
        headers: { Authorization: `${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCurrentNews(data.data);
        setIsNewsModalOpen(true);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load news.', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  // Handle file selection + generate preview
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 10 - selectedMedia.length);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

    setSelectedMedia((prev) => [...prev, ...newFiles]);
    setMediaPreviews((prev) => [...prev, ...newPreviews]);

    // Reset input to allow re-selecting same file
    e.target.value = '';
  };

  // Remove media + revoke preview URL
  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
    const urlToRevoke = mediaPreviews[index];
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
    if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
  };

  // Create post with media
  const handleCreatePost = async () => {
    if (!newPost.trim() && selectedMedia.length === 0) return;

    setIsPosting(true);
    const formData = new FormData();
    formData.append('content', newPost);
    selectedMedia.forEach((file) => formData.append('media', file));

    try {
      const res = await fetch('http://localhost:9000/posts', {
        method: 'POST',
        headers: { Authorization: `${token}` },
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        // Reset everything
        setNewPost('');
        setSelectedMedia([]);
        setMediaPreviews((prev) => {
          prev.forEach(URL.revokeObjectURL);
          return [];
        });
        setShowCreatePost(false);

        // Reset file inputs
        if (imageInputRef.current) imageInputRef.current.value = '';
        if (videoInputRef.current) videoInputRef.current.value = '';

        fetchData(false);
        toast({ title: 'Post created!', description: 'Your post is live.' });
      } else {
        toast({
          title: 'Failed to post',
          description: data.message || 'Try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload post. Check your connection.',
        variant: 'destructive',
      });
    } finally {
      setIsPosting(false);
    }
  };

  // BULLETPROOF LIKE/UNLIKE
  const handleLike = async (postId: number) => {
    const post = posts.find((p) => p.id === postId);
    if (!post || !user) return;

    const isLiked = post.likes.some((l) => l.user.id === user.id);
    const userLike = post.likes.find((l) => l.user.id === user.id);

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likes: isLiked
                ? p.likes.filter((l) => l.user.id !== user.id)
                : [...p.likes, { user: { id: user.id } } as any],
            }
          : p
      )
    );

    try {
      let data;
      if (isLiked && userLike?.id) {
        const res = await fetch(`http://localhost:9000/likes/${userLike.id}/${postId}`, {
          method: 'DELETE',
          headers: { Authorization: `${token}` },
        });
        data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to unlike');
      } else {
        const res = await fetch(`http://localhost:9000/likes/${postId}`, {
          method: 'POST',
          headers: { Authorization: `${token}` },
        });
        data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to like');

        if (data.data?.like?.id) {
          const realId = data.data.like.id;
          setPosts((prev) =>
            prev.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    likes: p.likes.map((l) => (!l.id ? { id: realId, user: l.user } : l)),
                  }
                : p
            )
          );
        }
      }
    } catch (error: any) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes: isLiked
                  ? [...p.likes, userLike!]
                  : p.likes.filter((l) => l.user.id !== user.id),
              }
            : p
        )
      );
      toast({
        title: isLiked ? 'Failed to unlike' : 'Failed to like',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleComment = (id: number) => {
    const post = posts.find((p) => p.id === id);
    if (post) setCurrentModalPost(post);
  };

  const handleOpenPost = (id: number) => {
    const post = posts.find((p) => p.id === id);
    if (post) setCurrentModalPost(post);
  };

  const handleNavigateToProfile = (id: string) => navigate(`/profile/${id}`);
  const handleOpenNews = (id: number) => fetchNewsById(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
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
            <Card className="shadow-card border-0 bg-gradient-hero text-primary-foreground">
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.first_name}!</h1>
                <p className="text-primary-foreground/80">Stay connected</p>
              </CardContent>
            </Card>

            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                {!showCreatePost ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:bg-muted"
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
                    {mediaPreviews.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {mediaPreviews.map((url, index) => (
                          <div key={index} className="relative group">
                            {selectedMedia[index]?.type.startsWith('image/') ? (
                              <img
                                src={url}
                                alt="preview"
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                            ) : (
                              <video
                                src={url}
                                className="w-20 h-20 object-cover rounded-lg"
                                muted
                              />
                            )}
                            <button
                              onClick={() => removeMedia(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => imageInputRef.current?.click()}
                        >
                          <Image className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => videoInputRef.current?.click()}
                        >
                          <Video className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setShowCreatePost(false);
                            setNewPost('');
                            setSelectedMedia([]);
                            setMediaPreviews((prev) => {
                              prev.forEach(URL.revokeObjectURL);
                              return [];
                            });
                            if (imageInputRef.current) imageInputRef.current.value = '';
                            if (videoInputRef.current) videoInputRef.current.value = '';
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="hero"
                          onClick={handleCreatePost}
                          disabled={(!newPost.trim() && selectedMedia.length === 0) || isPosting}
                        >
                          {isPosting ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Post
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

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
                      No posts yet. Be the first to share something!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Campus News</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {news.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => handleOpenNews(item.id)}
                  >
                    <h4 className="font-medium text-sm line-clamp-2 mb-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {item.content}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

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

      {/* Hidden File Inputs */}
      <input
        type="file"
        accept="image/*"
        multiple
        hidden
        ref={imageInputRef}
        onChange={handleMediaSelect}
      />
      <input
        type="file"
        accept="video/*"
        multiple
        hidden
        ref={videoInputRef}
        onChange={handleMediaSelect}
      />

      {/* Modals */}
      <PostModal
        post={currentModalPost}
        isOpen={!!currentModalPost}
        onClose={() => setCurrentModalPost(null)}
        likedPostIds={likedPostIds}
        onLike={handleLike}
        onNavigateToProfile={handleNavigateToProfile}
      />

      <NewsModal
        news={currentNews}
        isOpen={isNewsModalOpen}
        onClose={() => {
          setCurrentNews(null);
          setIsNewsModalOpen(false);
        }}
      />
    </div>
  );
};

export default Home;