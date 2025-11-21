/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, Send, Loader2, Search, Check, CheckCheck, ArrowLeft } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface User {
  id: string;
  first_name: string;
  second_name: string;
  username: string;
  bio?: string;
  profilePhoto?: { url: string };
}

interface Participant {
  user: User;
}

interface Chat {
  id: number;
  participants: Participant[];
}

interface Message {
  id: number;
  sender: { id: string; username: string; first_name: string };
  receiver: { id: string };
  content: string;
  isRead: boolean;
  sentAt: Date;
}

const Chat = () => {
  const { user, token } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const normalizeUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('./')) return `http://localhost:9000/${url.slice(2)}`;
    return url.startsWith('http') ? url : `http://localhost:9000/${url}`;
  };

  // Fetch chats with deduplication
  const fetchChats = async () => {
    if (!token || !user?.id) return;
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:9000/chats/user/${user.id}`, {
        headers: { Authorization: `${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch chats');
      const data: Chat[] = await response.json();
      const unique = new Map<number, Chat>();
      data.forEach((c) => !unique.has(c.id) && unique.set(c.id, c));
      setChats(Array.from(unique.values()));
    } catch {
      toast({ title: 'Error', description: 'Failed to load chats.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (chatId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:9000/messages/chat/${chatId}`, {
        headers: { Authorization: `${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data.map((m: any) => ({ ...m, sentAt: new Date(m.sentAt) })));

      // Mark as read
      await fetch('http://localhost:9000/messages/read', {
        method: 'POST',
        headers: { Authorization: `${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, userId: user?.id }),
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to load messages.', variant: 'destructive' });
    }
  };

  // Socket setup
  useEffect(() => {
    if (!token || !user?.id) return;

    fetchChats();

    socketRef.current = io('http://localhost:9000', {
      auth: { token },
      withCredentials: true,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      socketRef.current?.emit('register', user.id);
    });

    socketRef.current.on('newMessage', (msg: Message) => {
      setMessages((prev) => [...prev, { ...msg, sentAt: new Date(msg.sentAt) }]);
      if (msg.chat?.id !== selectedChat?.id) fetchChats();
    });

    socketRef.current.on('connect_error', (err) => {
      toast({ title: 'Connection Error', description: err.message, variant: 'destructive' });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token, user]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      socketRef.current?.emit('joinChat', { chatId: selectedChat.id });
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
  };

  const handleBack = () => {
    setSelectedChat(null);
    setMessages([]);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user?.id) return;
    const other = selectedChat.participants.find(p => p.user.id !== user.id)?.user;
    if (!other) return;

    setIsSending(true);
    try {
      socketRef.current?.emit('sendMessage', {
        chatId: selectedChat.id,
        senderId: user.id,
        receiverId: other.id,
        content: newMessage,
      });
      setNewMessage('');
    } catch {
      toast({ title: 'Error', description: 'Failed to send message.', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const filteredChats = chats.filter((chat) => {
    const other = chat.participants.find(p => p.user.id !== user?.id)?.user;
    if (!other) return false;
    const q = searchQuery.toLowerCase();
    return (
      other.first_name.toLowerCase().includes(q) ||
      other.second_name.toLowerCase().includes(q) ||
      other.username.toLowerCase().includes(q)
    );
  });

  const otherUser = selectedChat?.participants.find(p => p.user.id !== user?.id)?.user;

  // Mobile: Show chat list OR conversation
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading chats...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">

      {/* === CHAT LIST (Mobile: full screen | Desktop: 1/3) === */}
      <div className={`flex flex-col border-r bg-card ${selectedChat ? 'hidden md:flex md:w-1/3' : 'w-full md:w-1/3'}`}>
        <Card className="h-full rounded-none border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="h-5 w-5" />
                Chats
              </CardTitle>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {filteredChats.length > 0 ? (
              filteredChats.map((chat) => {
                const u = chat.participants.find(p => p.user.id !== user?.id)?.user;
                if (!u) return null;
                return (
                  <div
                    key={chat.id}
                    onClick={() => handleSelectChat(chat)}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={normalizeUrl(u.profilePhoto?.url)} />
                      <AvatarFallback className="text-xs">
                        {u.first_name[0]}{u.second_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {u.first_name} {u.second_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-sm text-muted-foreground mt-6">No chats found</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* === CONVERSATION VIEW (Mobile: full | Desktop: 2/3) === */}
      <div className={`flex flex-col ${selectedChat ? 'w-full md:w-2/3' : 'hidden md:flex md:w-2/3'}`}>
        {selectedChat ? (
          <>
            {/* Header with back button on mobile */}
            <CardHeader className="flex items-center gap-3 border-b p-3 md:p-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="md:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-9 w-9">
                <AvatarImage src={normalizeUrl(otherUser?.profilePhoto?.url)} />
                <AvatarFallback className="text-xs">
                  {otherUser?.first_name[0]}{otherUser?.second_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {otherUser?.first_name} {otherUser?.second_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">@{otherUser?.username}</p>
              </div>
            </CardHeader>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                      msg.sender.id === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 text-xs opacity-70">
                      <span>{msg.sentAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.sender.id === user?.id && (
                        msg.isRead ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-3 md:p-4 flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 h-10 text-sm"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isSending || !newMessage.trim()}
                size="icon"
                className="h-10 w-10"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;