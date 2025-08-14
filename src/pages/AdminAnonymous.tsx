import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { 
  Loader2, 
  RefreshCw, 
  Heart,
  MessageCircle,
  Eye,
  Trash2,
  User,
  Calendar
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
  author?: {
    id: string;
    first_name: string;
    second_name: string;
    username: string;
    profilePhoto: { url: string } | null;
  };
}

const AdminAnonymous = () => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<AnonymousMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this anonymous message?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:9000/anonymous/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        toast({
          title: "Message deleted",
          description: "The anonymous message has been deleted successfully.",
        });
      } else {
        toast({
          title: "Failed to delete message",
          description: data.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to delete message. Please try again.",
        variant: "destructive",
      });
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
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <Card className="shadow-card border-0 bg-gradient-hero text-primary-foreground">
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold mb-2">
                Admin: Anonymous Messages 🔍
              </h1>
              <p className="text-primary-foreground/80">
                Manage anonymous messages with author visibility for administrators
              </p>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{messages.length}</p>
                    <p className="text-sm text-muted-foreground">Total Messages</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Heart className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {messages.reduce((sum, msg) => sum + (msg.likes?.length || 0), 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Likes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Eye className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {messages.reduce((sum, msg) => sum + (msg.views || 0), 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Views</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Refresh Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Anonymous Messages</h2>
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

          {/* Messages List */}
          <div className="space-y-6">
            {messages.length > 0 ? (
              messages.map((message) => (
                <Card key={message.id} className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Admin Header with Author Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage 
                              src={message.author?.profilePhoto?.url ? normalizeUrl(message.author.profilePhoto.url) : ''} 
                              alt={message.author?.username || 'Anonymous'}
                            />
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                              {message.author ? 
                                `${message.author.first_name[0]}${message.author.second_name[0]}` : 
                                '?'
                              }
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-foreground">
                                {message.author ? 
                                  `${message.author.first_name} ${message.author.second_name}` : 
                                  'Anonymous'
                                }
                              </p>
                              {message.author && (
                                <span className="text-sm text-muted-foreground">
                                  @{message.author.username}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(message.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>ID: {message.id}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMessage(message.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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

                      {/* Stats */}
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <Heart className="w-4 h-4" />
                            <span>{message.likes?.length || 0} likes</span>
                          </div>

                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <MessageCircle className="w-4 h-4" />
                            <span>{message.comments?.length || 0} comments</span>
                          </div>

                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <Eye className="w-4 h-4" />
                            <span>{message.views || 0} views</span>
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
                    No anonymous messages found.
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

export default AdminAnonymous;