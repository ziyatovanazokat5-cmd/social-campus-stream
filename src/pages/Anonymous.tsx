import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Plus, 
  RefreshCw, 
  Send, 
  Image as ImageIcon, 
  Video, 
  Heart,
  MessageCircle,
  Eye,
  X,
  Paperclip
} from 'lucide-react';

interface AnonymousMessage {
  id: number;
  message: string;
  media: Array<{
    type: 'image' | 'video';
    url: string;
  }>;
  likes: any[];
  comments: Array<{
    id: number;
    text: string;
    user: {
      id: string;
      username: string;
      first_name: string;
    };
  }>;
  views: number;
  createdAt: string;
}

const Anonymous = () => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<AnonymousMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [likedMessageIds, setLikedMessageIds] = useState<number[]>([]);

  const fetchMessages = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const response = await fetch('http://localhost:9000/anonymous', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setMessages(data.data || []);
      } else {
        console.error('Failed to fetch messages:', data.message);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: "Connection Error",
        description: "Unable to load anonymous messages. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMessages();
    }
  }, [token]);

  const normalizeUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('./')) {
      return `http://localhost:9000/${url.slice(2)}`;
    }
    return url.startsWith('http') ? url : `http://localhost:9000/${url}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files].slice(0, 10)); // Max 10 files
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    
    setIsPosting(true);
    try {
      const formData = new FormData();
      formData.append('message', newMessage);
      
      selectedFiles.forEach((file) => {
        formData.append('media', file);
      });

      const response = await fetch('http://localhost:9000/anonymous', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        setSelectedFiles([]);
        setShowCreatePost(false);
        fetchMessages(false); // Refresh messages
        toast({
          title: "Anonymous message posted!",
          description: "Your message has been shared anonymously.",
        });
      } else {
        toast({
          title: "Failed to post message",
          description: data.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to post message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (messageId: number) => {
    try {
      const isCurrentlyLiked = likedMessageIds.includes(messageId);
      
      // Optimistic update
      if (isCurrentlyLiked) {
        setLikedMessageIds(prev => prev.filter(id => id !== messageId));
      } else {
        setLikedMessageIds(prev => [...prev, messageId]);
      }

      const response = await fetch(`http://localhost:9000/anonymous/${messageId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!data.success) {
        // Revert optimistic update on failure
        if (isCurrentlyLiked) {
          setLikedMessageIds(prev => [...prev, messageId]);
        } else {
          setLikedMessageIds(prev => prev.filter(id => id !== messageId));
        }
        toast({
          title: "Failed to update like",
          description: data.message || "Please try again.",
          variant: "destructive",
        });
      } else {
        fetchMessages(false);
      }
    } catch (error) {
      // Revert optimistic update on error
      const isCurrentlyLiked = likedMessageIds.includes(messageId);
      if (isCurrentlyLiked) {
        setLikedMessageIds(prev => [...prev, messageId]);
      } else {
        setLikedMessageIds(prev => prev.filter(id => id !== messageId));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading anonymous messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card className="shadow-card border-0 bg-gradient-hero text-primary-foreground">
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold mb-2">
                Anonymous Messages 🎭
              </h1>
              <p className="text-primary-foreground/80">
                Share your thoughts anonymously with the campus community
              </p>
            </CardContent>
          </Card>

          {/* Create Message */}
          <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              {!showCreatePost ? (
                <Button
                  variant="ghost"
                  className="w-full text-left justify-start text-muted-foreground hover:bg-muted"
                  onClick={() => setShowCreatePost(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Share something anonymously...
                </Button>
              ) : (
                <div className="space-y-4">
                  <Textarea
                    placeholder="What's on your mind? (This will be posted anonymously)"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="resize-none border-0 focus-visible:ring-0 text-base"
                    rows={3}
                  />
                  
                  {/* File Previews */}
                  {selectedFiles.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                            {file.type.startsWith('image/') ? (
                              <img
                                src={URL.createObjectURL(file)}
                                alt="Preview"
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Video className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <label htmlFor="file-upload">
                        <Button variant="ghost" size="sm" asChild>
                          <span className="cursor-pointer">
                            <Paperclip className="w-4 h-4" />
                          </span>
                        </Button>
                      </label>
                      <Input
                        id="file-upload"
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowCreatePost(false);
                          setNewMessage('');
                          setSelectedFiles([]);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="hero"
                        onClick={handleCreateMessage}
                        disabled={(!newMessage.trim() && selectedFiles.length === 0) || isPosting}
                      >
                        {isPosting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Post Anonymously
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Refresh Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Anonymous Feed</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMessages(false)}
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

          {/* Messages Feed */}
          <div className="space-y-6">
            {messages.length > 0 ? (
              messages.map((message) => (
                <Card key={message.id} className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Anonymous Header */}
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                            ?
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">Anonymous</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(message.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Message Content */}
                      <div className="space-y-3">
                        {message.message && (
                          <p className="text-foreground leading-relaxed">{message.message}</p>
                        )}

                        {/* Media */}
                        {message.media && message.media.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                            {message.media.map((media, index) => (
                              <div key={index} className="rounded-lg overflow-hidden">
                                {media.type === 'image' ? (
                                  <img
                                    src={normalizeUrl(media.url)}
                                    alt="Anonymous media"
                                    className="w-full h-auto object-cover"
                                  />
                                ) : (
                                  <video
                                    src={normalizeUrl(media.url)}
                                    controls
                                    className="w-full h-auto"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center space-x-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLike(message.id)}
                            className={`space-x-2 ${
                              likedMessageIds.includes(message.id) ? 'text-red-500' : 'text-muted-foreground'
                            }`}
                          >
                            <Heart 
                              className={`w-4 h-4 ${
                                likedMessageIds.includes(message.id) ? 'fill-current' : ''
                              }`} 
                            />
                            <span>{message.likes?.length || 0}</span>
                          </Button>

                          <Button variant="ghost" size="sm" className="space-x-2 text-muted-foreground">
                            <MessageCircle className="w-4 h-4" />
                            <span>{message.comments?.length || 0}</span>
                          </Button>

                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">{message.views || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No anonymous messages yet. Be the first to share something anonymously!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Anonymous;