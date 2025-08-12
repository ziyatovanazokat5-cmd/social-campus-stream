import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, Send, Users, Loader2, Search } from 'lucide-react';

interface User {
  id: number;
  first_name: string;
  second_name: string;
  username: string;
  bio: string;
  profilePhoto: { url: string };
}

interface Message {
  id: number;
  sender: {
    id: number;
    username: string;
    first_name: string;
  };
  content: string;
  isRead: boolean;
  createdAt: string;
}

const Chat = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const normalizeUrl = (url: string) => {
    if (url?.startsWith('./')) {
      return `http://localhost:9000/${url.slice(2)}`;
    }
    return url?.startsWith('http') ? url : `http://localhost:9000/${url}`;
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        // Filter out current user
        const otherUsers = (data.data || []).filter((u: User) => u.id !== parseInt(user?.id || '0'));
        setUsers(otherUsers);
      } else {
        toast({
          title: "Failed to load users",
          description: data.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection error",
        description: "Unable to load users. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (chatUserId: number) => {
    try {
      // This would typically fetch messages for a specific chat
      // For now, we'll simulate with empty messages
      setMessages([]);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const handleSelectUser = (selectedUser: User) => {
    setSelectedUser(selectedUser);
    fetchMessages(selectedUser.id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    setIsSending(true);
    try {
      // Simulate sending a message
      const newMsg: Message = {
        id: Date.now(),
        sender: {
          id: parseInt(user?.id || '0'),
          username: user?.username || '',
          first_name: user?.first_name || ''
        },
        content: newMessage,
        isRead: false,
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      
      toast({
        title: "Message sent!",
        description: `Your message was sent to ${selectedUser.first_name}.`,
      });
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.second_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Users List */}
          <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Campus Community</span>
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((chatUser) => (
                    <Button
                      key={chatUser.id}
                      variant="ghost"
                      className={`w-full justify-start p-4 h-auto ${
                        selectedUser?.id === chatUser.id ? 'bg-primary/10 text-primary' : ''
                      }`}
                      onClick={() => handleSelectUser(chatUser)}
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <Avatar className="w-12 h-12">
                          <AvatarImage 
                            src={chatUser.profilePhoto?.url ? normalizeUrl(chatUser.profilePhoto.url) : ''} 
                            alt={chatUser.username}
                          />
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                            {chatUser.first_name[0]}{chatUser.second_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="font-medium">
                            {chatUser.first_name} {chatUser.second_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{chatUser.username}
                          </p>
                          {chatUser.bio && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {chatUser.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No users found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm h-full flex flex-col">
              {selectedUser ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="border-b">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage 
                          src={selectedUser.profilePhoto?.url ? normalizeUrl(selectedUser.profilePhoto.url) : ''} 
                          alt={selectedUser.username}
                        />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {selectedUser.first_name[0]}{selectedUser.second_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {selectedUser.first_name} {selectedUser.second_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          @{selectedUser.username}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length > 0 ? (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender.id === parseInt(user?.id || '0') 
                              ? 'justify-end' 
                              : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender.id === parseInt(user?.id || '0')
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Start a conversation with {selectedUser.first_name}
                        </p>
                      </div>
                    )}
                  </CardContent>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        variant="hero"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSending}
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Start a Conversation</h3>
                    <p className="text-muted-foreground">
                      Select a student from the list to begin chatting
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;