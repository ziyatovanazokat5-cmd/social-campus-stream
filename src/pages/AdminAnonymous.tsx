/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Author {
  id: string;
  username: string;
  first_name: string;
  second_name?: string;
  third_name?: string;
  bio?: string;
  group?: string;
  profilePhoto?: { 
    id: number;
    url: string;
    uploadedAt?: string;
  };
  role?: string;
}

interface AnonymousMessage {
  id: number;
  message: string;
  media: Array<{
    type: 'image' | 'video';
    url: string;
  }>;
  comments: Array<{
    id: number;
    text: string;
    author: Author;
  }>;
  views: number;
  createdAt: string;
  author: Author | null; // Updated to reflect API structure
}

const AdminAnonymous = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<AnonymousMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMessages = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const response = await fetch('http://localhost:9000/anonymous', {
        headers: {
          Authorization: `${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setMessages(data.data || []);
      } else {
        toast({
          title: 'Failed to fetch messages',
          description: data.message || 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: 'Unable to load anonymous messages. Please check your connection.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this anonymous message?')) return;

    try {
      const response = await fetch(`http://localhost:9000/anonymous/${messageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        toast({
          title: 'Message deleted',
          description: 'Anonymous message has been removed successfully.',
        });
      } else {
        toast({
          title: 'Failed to delete message',
          description: data.message || 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to delete message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/home');
      return;
    }
    if (token) {
      fetchMessages();
    }
  }, [token, user?.role]);

  const normalizeUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('./')) {
      return `http://localhost:9000/${url.slice(2)}`;
    }
    return url.startsWith('http') ? url : `http://localhost:9000/${url}`;
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
              <h1 className="text-2xl font-bold mb-2 flex items-center">
                <Eye className="w-6 h-6 mr-2" />
                Manage Anonymous Messages
              </h1>
              <p className="text-primary-foreground/80">
                View and moderate anonymous messages posted by the campus community
              </p>
            </CardContent>
          </Card>

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

          {/* Messages Feed */}
          <div className="space-y-6">
            {messages.length > 0 ? (
              messages.map((message) => (
                <Card
                  key={message.id}
                  className="shadow-card border-0 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            {message.author?.profilePhoto?.url ? (
                              <AvatarImage src={normalizeUrl(message.author.profilePhoto.url)} />
                            ) : (
                              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                                {message.author
                                  ? `${message.author.first_name[0]}${message.author.second_name?.[0] || ''}`
                                  : '?'}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {message.author
                                ? `${message.author.first_name} ${message.author.second_name || ''} ${message.author.third_name || ''} (@${message.author.username})`
                                : 'Anonymous'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(message.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteMessage(message.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {message.message && (
                          <p className="text-foreground leading-relaxed">{message.message}</p>
                        )}
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
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center space-x-6">
                          <span className="flex items-center space-x-2 text-muted-foreground">
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">{message.views || 0}</span>
                          </span>
                          <span className="flex items-center space-x-2 text-muted-foreground">
                            <span className="text-sm">Comments: {message.comments?.length || 0}</span>
                          </span>
                        </div>
                      </div>
                      {message.comments && message.comments.length > 0 && (
                        <div className="space-y-2 pt-4">
                          <h3 className="text-sm font-semibold">Comments</h3>
                          {message.comments.map((comment) => (
                            <div key={comment.id} className="flex items-start space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>{comment.author.first_name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {comment.author.first_name} {comment.author.second_name || ''} (@{comment.author.username})
                                </p>
                                <p className="text-sm text-muted-foreground">{comment.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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