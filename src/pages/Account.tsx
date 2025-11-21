/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, Component, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Heart, User, Users, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Media {
  type: "image" | "video";
  url: string;
}

interface Like {
  id: number;
  user: {
    id: string;
  };
}

interface Post {
  id: number;
  content: string;
  views: number;
  createdAt: string;
  media?: Media[];
  likes: Like[];
}

interface Subscription {
  id: number;
  subscriber: {
    id: string;
  };
  subscribedTo: {
    id: string;
  };
}

interface User {
  id: string;
  first_name: string;
  second_name: string;
  third_name: string;
  bio: string;
  username: string;
  role: string;
  profilePhoto?: {
    id: number;
    url: string;
    uploadedAt: string;
  };
  group?: string;
  posts: Post[];
  subscriptionsReceived: Subscription[];
  subscriptionsSent: Subscription[];
}

interface Participant {
  user: User;
}

interface Chat {
  id: number;
  participants: Participant[];
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Something went wrong. Please try again later.
            </p>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

const Account: React.FC = () => {
  const { user, token } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [accountUser, setAccountUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);

  const normalizeUrl = (url: string) => {
    if (url.startsWith("./")) {
      return `http://localhost:9000/${url.slice(2)}`;
    }
    return url.startsWith("http") ? url : `http://localhost:9000/${url}`;
  };

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:9000/users/one/${id}`, {
        headers: {
          Authorization: `${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setAccountUser(data.data);
        const likedIds = (data.data.posts || [])
          .filter((post: Post) =>
            post.likes.some((like) => like.user.id === user?.id)
          )
          .map((post: Post) => post.id);
        setLikedPostIds(likedIds);
        const isFollowingUser = data.data.subscriptionsReceived.some(
          (sub: Subscription) => sub.subscriber.id === user?.id
        );
        setIsFollowing(isFollowingUser);
      } else {
        toast({
          title: "Failed to load user",
          description: data.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to load user data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) {
      fetchUserData();
    }
  }, [token, id]);

  const handleFollow = async () => {
    if (!user?.id || !accountUser?.id) {
      toast({
        title: "Error",
        description: "Authentication required to follow user.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:9000/subscriptions/${user.id}/${accountUser.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setIsFollowing(true);
        fetchUserData();
        toast({
          title: "Followed",
          description: `You are now following @${accountUser?.username}`,
        });
      } else {
        toast({
          title: "Failed to follow",
          description: data.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to follow user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUnfollow = async () => {
    if (!user?.id || !accountUser?.id) {
      toast({
        title: "Error",
        description: "Authentication required to unfollow user.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:9000/subscriptions/${user.id}/${accountUser.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setIsFollowing(false);
        fetchUserData();
        toast({
          title: "Unfollowed",
          description: `You have unfollowed @${accountUser?.username}`,
        });
      } else {
        toast({
          title: "Failed to unfollow",
          description: data.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to unfollow user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMessage = async () => {
    if (!user?.id || !accountUser?.id || !token) {
      toast({
        title: "Error",
        description: "Authentication required to start a chat.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Fetch existing chats to check if one already exists
      const chatsResponse = await fetch(
        `http://localhost:9000/chats/user/${user.id}`,
        {
          headers: { Authorization: `${token}` },
        }
      );

      if (!chatsResponse.ok) {
        throw new Error("Failed to fetch chats");
      }

      const chats: Chat[] = await chatsResponse.json();
      const existingChat = chats.find((chat) =>
        chat.participants.some((p) => p.user.id === accountUser.id)
      );

      if (existingChat) {
        // Navigate to existing chat
        navigate(`/chat`);
      } else {
        // Create a new chat
        const createChatResponse = await fetch(`http://localhost:9000/chats`, {
          method: "POST",
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userIds: [user.id, accountUser.id] }),
        });

        const createChatData = await createChatResponse.json();
        if (createChatData.success) {
          const newChatId = createChatData.data.id;
          navigate(`/chat`);
        } else {
          throw new Error(createChatData.message || "Failed to create chat");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to start chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const isCurrentlyLiked = likedPostIds.includes(postId);

      if (isCurrentlyLiked) {
        setLikedPostIds((prev) => prev.filter((id) => id !== postId));
      } else {
        setLikedPostIds((prev) => [...prev, postId]);
      }

      const currentPost = accountUser?.posts.find((p) => p.id === postId);

      if (isCurrentlyLiked) {
        const userLike = currentPost?.likes.find((l) => l.user.id === user?.id);

        if (userLike) {
          const response = await fetch(
            `http://localhost:9000/likes/${userLike.id}/${postId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `${token}`,
              },
            }
          );

          const data = await response.json();
          if (!data.success) {
            setLikedPostIds((prev) => [...prev, postId]);
            toast({
              title: "Failed to unlike",
              description: data.message || "Please try again.",
              variant: "destructive",
            });
          } else {
            fetchUserData();
          }
        } else {
          setLikedPostIds((prev) => [...prev, postId]);
        }
      } else {
        const response = await fetch(`http://localhost:9000/likes/${postId}`, {
          method: "POST",
          headers: {
            Authorization: `${token}`,
          },
        });

        const data = await response.json();
        if (!data.success) {
          setLikedPostIds((prev) => prev.filter((id) => id !== postId));
          toast({
            title: "Failed to like",
            description: data.message || "Please try again.",
            variant: "destructive",
          });
        } else {
          fetchUserData();
        }
      }
    } catch (error) {
      const isCurrentlyLiked = likedPostIds.includes(postId);
      if (isCurrentlyLiked) {
        setLikedPostIds((prev) => [...prev, postId]);
      } else {
        setLikedPostIds((prev) => prev.filter((id) => id !== postId));
      }
      toast({
        title: "Error",
        description: "Unable to update like. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDateSafely = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "Invalid date";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (!accountUser) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">User not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header Navigation */}
            <header className="mb-6">
              <nav className="flex space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/home")}
                  className="text-muted-foreground hover:text-primary"
                >
                  Home
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate(`/profile/${user?.id}`)}
                  className="text-muted-foreground hover:text-primary"
                >
                  Profile
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/logout")}
                  className="text-muted-foreground hover:text-primary"
                >
                  Logout
                </Button>
              </nav>
            </header>

            {/* Profile Header */}
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm mb-8">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-shrink-0">
                    <Avatar className="w-32 h-32 ring-4 ring-primary/20">
                      <AvatarImage
                        src={
                          accountUser.profilePhoto?.url
                            ? normalizeUrl(accountUser.profilePhoto.url)
                            : ""
                        }
                        alt={accountUser.username}
                      />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground text-3xl font-bold">
                        {accountUser.first_name[0]}
                        {accountUser.second_name[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-3xl font-bold text-foreground">
                          {accountUser.first_name} {accountUser.second_name}{" "}
                          {accountUser.third_name}
                        </h1>
                        <p className="text-xl text-muted-foreground">
                          @{accountUser.username}
                        </p>
                        {accountUser.role && (
                          <span className="inline-block px-3 py-1 mt-2 text-xs font-medium bg-primary/10 text-primary rounded-full">
                            {accountUser.role.charAt(0).toUpperCase() +
                              accountUser.role.slice(1)}
                          </span>
                        )}
                      </div>
                      {user?.id !== accountUser.id && (
                        <Button
                          variant={isFollowing ? "ghost" : "hero"}
                          onClick={isFollowing ? handleUnfollow : handleFollow}
                          className={`transition-all duration-300 ${
                            isFollowing
                              ? "text-primary hover:text-primary/80"
                              : ""
                          }`}
                        >
                          {isFollowing ? (
                            <>
                              <UserMinus className="w-4 h-4 mr-2" />
                              Unfollow
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Follow
                            </>
                          )}
                        </Button>
                      )}
                      {user?.id !== accountUser.id && (
                        <Button
                          variant="hero"
                          onClick={handleMessage}
                          className="ml-2"
                        >
                          Message
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">
                          {accountUser.posts.reduce(
                            (acc, post) => acc + post.likes.length,
                            0
                          )}{" "}
                          Likes
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">
                          {accountUser.subscriptionsReceived.length} Subscribers
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">
                          {accountUser.group || "No group"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Info and Activity */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Full Name
                    </h3>
                    <p className="text-foreground">
                      {accountUser.first_name} {accountUser.second_name}{" "}
                      {accountUser.third_name}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Username
                    </h3>
                    <p className="text-foreground">@{accountUser.username}</p>
                  </div>
                  {accountUser.group && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Study Group
                      </h3>
                      <p className="text-foreground">{accountUser.group}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Bio
                    </h3>
                    <p className="text-foreground">
                      {accountUser.bio || "No bio provided yet."}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Activity Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <Heart className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium">Likes</p>
                          <p className="text-sm text-muted-foreground">
                            Total post interactions
                          </p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-red-500">
                        {accountUser.posts.reduce(
                          (acc, post) => acc + post.likes.length,
                          0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium">Subscribers</p>
                          <p className="text-sm text-muted-foreground">
                            People following you
                          </p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-blue-500">
                        {accountUser.subscriptionsReceived.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium">Posts</p>
                          <p className="text-sm text-muted-foreground">
                            Total posts shared
                          </p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-green-500">
                        {accountUser.posts.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Posts Section */}
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>
                  {user?.id === accountUser.id
                    ? "My Posts"
                    : `${accountUser.first_name}'s Posts`}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {accountUser.posts.length > 0 ? (
                  accountUser.posts.map((post) => (
                    <div
                      key={post.id}
                      className="p-4 bg-muted/50 rounded-lg space-y-4"
                    >
                      <p className="text-foreground">{post.content}</p>
                      {post.media && post.media.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {post.media.map((media, index) => (
                            <div
                              key={index}
                              className="relative rounded-lg overflow-hidden"
                            >
                              {media.type === "image" ? (
                                <img
                                  src={normalizeUrl(media.url)}
                                  alt="Post media"
                                  className="w-full h-48 object-cover"
                                />
                              ) : media.type === "video" ? (
                                <video
                                  src={normalizeUrl(media.url)}
                                  className="w-full h-48 object-cover"
                                  controls
                                />
                              ) : (
                                <div className="w-full h-48 bg-muted flex items-center justify-center">
                                  <span className="text-muted-foreground">
                                    Media unavailable
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{formatDateSafely(post.createdAt)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(post.id)}
                          className={`transition-all duration-300 ${
                            likedPostIds.includes(post.id)
                              ? "text-red-500 hover:text-red-600"
                              : "text-muted-foreground hover:text-red-500"
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              likedPostIds.includes(post.id)
                                ? "fill-current"
                                : ""
                            }`}
                          />
                          <span className="ml-1">{post.likes.length}</span>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center">
                    No posts yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Account;