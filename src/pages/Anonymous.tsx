/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Paperclip,
} from 'lucide-react';

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
    author: {
      id: string;
      username: string;
      first_name: string;
    } | null; // Allow null
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
  const [selectedMessage, setSelectedMessage] = useState<AnonymousMessage | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

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

  const fetchSingleMessage = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:9000/anonymous/${id}`, {
        headers: {
          Authorization: `${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSelectedMessage(data.data);
        // Update the main messages list to reflect any changes (e.g., new comments)
        setMessages((prev) =>
          prev.map((msg) => (msg.id === id ? data.data : msg))
        );
      } else {
        toast({
          title: 'Failed to fetch message',
          description: data.message || 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: 'Unable to load message details.',
        variant: 'destructive',
      });
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
    setSelectedFiles((prev) => [...prev, ...files].slice(0, 10)); // Max 10 files
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
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
          Authorization: `${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        setSelectedFiles([]);
        setShowCreatePost(false);
        fetchMessages(false);
        toast({
          title: 'Anonymous message posted!',
          description: 'Your message has been shared anonymously.',
        });
      } else {
        toast({
          title: 'Failed to post message',
          description: data.message || 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to post message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleOpenMessage = (message: AnonymousMessage) => {
    setSelectedMessage(message);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedMessage) return;

    setIsPostingComment(true);
    try {
      const response = await fetch(`http://localhost:9000/anonym-comments/${selectedMessage.id}`, {
        method: 'POST',
        headers: {
          Authorization: `${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newComment }),
      });

      const data = await response.json();
      if (data.success) {
        setNewComment('');
        fetchSingleMessage(selectedMessage.id); // Refresh message with new comment
        toast({
          title: 'Comment posted!',
          description: 'Your comment has been added.',
        });
      } else {
        toast({
          title: 'Failed to post comment',
          description: data.message || 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to post comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPostingComment(false);
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
                Anonymous Messages
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
                <Card
                  key={message.id}
                  className="shadow-card border-0 bg-card/80 backdrop-blur-sm cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleOpenMessage(message)}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="space-x-2 text-muted-foreground"
                          >
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

          {/* Anonymous Message Modal */}
          {selectedMessage && (
            <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
              <DialogContent className="sm:max-w-[600px] bg-card/80 backdrop-blur-sm shadow-card border-0">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-foreground">
                    Anonymous Message
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Message Content */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          ?
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">Anonymous</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedMessage.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {selectedMessage.message && (
                      <p className="text-foreground leading-relaxed">{selectedMessage.message}</p>
                    )}
                    {selectedMessage.media && selectedMessage.media.length > 0 && (
                      <div className="grid grid-cols-1 gap-2">
                        {selectedMessage.media.map((media, index) => (
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
                    <div className="flex items-center space-x-6 text-muted-foreground pt-4 border-t border-border">
                      <span className="flex items-center space-x-2">
                        <MessageCircle className="w-4 h-4" />
                        <span>{selectedMessage.comments?.length || 0}</span>
                      </span>
                      <span className="flex items-center space-x-2">
                        <Eye className="w-4 h-4" />
                        <span>{selectedMessage.views || 0}</span>
                      </span>
                    </div>
                  </div>

                  {/* Comments Section - FIXED */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Comments</h3>
                    {selectedMessage.comments.length > 0 ? (
                      <div className="max-h-64 overflow-y-auto space-y-4">
                        {selectedMessage.comments.map((comment) => {
                          const author = comment.author;
                          const displayName = author
                            ? `${author.first_name || 'User'} (@${author.username || 'unknown'})`
                            : 'Unknown User';
                          const avatarLetter = author?.first_name?.[0] || '?';

                          return (
                            <div key={comment.id} className="flex items-start space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">
                                  {avatarLetter}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {displayName}
                                </p>
                                <p className="text-sm text-muted-foreground">{comment.text}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No comments yet.</p>
                    )}
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="resize-none border-0 focus-visible:ring-0 text-base"
                        rows={2}
                      />
                      <Button
                        variant="hero"
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || isPostingComment}
                        className="w-full"
                      >
                        {isPostingComment ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Posting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Post Comment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
};

export default Anonymous;