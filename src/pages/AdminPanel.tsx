/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Users,
  Shield,
  Newspaper,
  Plus,
  Trash2,
  Edit,
  Ban,
  Loader2,
  UserCheck,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Admin {
  id: number;
  username: string;
  first_name: string;
  second_name: string;
  role: string;
  profilePhoto?: { url: string };
}

interface User {
  id: number;
  first_name: string;
  second_name: string;
  username: string;
  bio: string;
  group: string;
  profilePhoto?: { url: string };
}

interface NewsItem {
  id: number;
  title: string;
  text: string;
  createdAt?: string;
  media?: Array<{
    type: "image" | "video";
    url: string;
  }>;
}

const AdminPanel = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateNews, setShowCreateNews] = useState(false);
  const [newNewsTitle, setNewNewsTitle] = useState("");
  const [newNewsContent, setNewNewsContent] = useState("");
  const [newNewsFiles, setNewNewsFiles] = useState<FileList | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [imageError, setImageError] = useState<{ [key: string]: boolean }>({});

  const normalizeUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith("./")) {
      return `https://social.polito.uz/api/${url.slice(2)}`;
    }
    return url.startsWith("https") ? url : `https://social.polito.uz/api/${url}`;
  };

  const handleImageError = (url: string) => {
    setImageError((prev) => ({ ...prev, [url]: true }));
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [adminsRes, usersRes, newsRes] = await Promise.all([
        fetch("https://social.polito.uz/api/admin", {
          headers: { Authorization: `${token}` },
        }),
        fetch("https://social.polito.uz/api/users", {
          headers: { Authorization: `${token}` },
        }),
        fetch("https://social.polito.uz/api/news", {
          headers: { Authorization: `${token}` },
        }),
      ]);

      const [adminsData, usersData, newsData] = await Promise.all([
        adminsRes.json(),
        usersRes.json(),
        newsRes.json(),
      ]);

      if (adminsData.success) setAdmins(adminsData.data || []);
      if (usersData.success) setUsers(usersData.data || []);
      if (newsData.success) setNews(newsData.data || []);
    } catch (error) {
      toast({
        title: "Failed to load data",
        description: "Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/home");
      return;
    }
    if (token) {
      fetchData();
    }
  }, [token, user?.role]);

  const handleCreateNews = async () => {
    if (!newNewsTitle.trim() || !newNewsContent.trim()) return;

    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append("title", newNewsTitle);
      formData.append("text", newNewsContent);
      if (newNewsFiles) {
        Array.from(newNewsFiles).forEach((file) => {
          formData.append("media", file);
        });
      }

      const response = await fetch("https://social.polito.uz/api/news", {
        method: "POST",
        headers: {
          Authorization: `${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setNews((prev) => [data.data, ...prev]);
        setNewNewsTitle("");
        setNewNewsContent("");
        setNewNewsFiles(null);
        setShowCreateNews(false);
        toast({
          title: "News created!",
          description: "News article has been published successfully.",
        });
      } else {
        toast({
          title: "Failed to create news",
          description: data.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to create news. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`https://social.polito.uz/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        toast({
          title: "User deleted",
          description: "User has been removed successfully.",
        });
      } else {
        toast({
          title: "Failed to delete user",
          description: data.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNews = async (newsId: number) => {
    if (!confirm("Are you sure you want to delete this news article?")) return;

    try {
      const response = await fetch(`https://social.polito.uz/api/news/${newsId}`, {
        method: "DELETE",
        headers: {
          Authorization: `${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setNews((prev) => prev.filter((n) => n.id !== newsId));
        toast({
          title: "News deleted",
          description: "News article has been removed successfully.",
        });
      } else {
        toast({
          title: "Failed to delete news",
          description: data.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to delete news. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Shield className="w-8 h-8 mr-3 text-primary" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground">
            Manage users, admins, and campus content
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Admins Section */}
          <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-primary" />
                Admins ({admins.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {admins.length > 0 ? (
                admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        {admin.profilePhoto?.url ? (
                          <AvatarImage
                            src={normalizeUrl(admin.profilePhoto.url)}
                          />
                        ) : null}
                        <AvatarFallback className="text-xs">
                          {admin.first_name[0]}
                          {admin.second_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {admin.first_name} {admin.second_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{admin.username}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">
                      {admin.role}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No admins found
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary" />
                Users ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {users.length > 0 ? (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        {user.profilePhoto?.url ? (
                          <AvatarImage
                            src={normalizeUrl(user.profilePhoto.url)}
                          />
                        ) : null}
                        <AvatarFallback className="text-xs">
                          {user.first_name[0]}
                          {user.second_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {user.first_name} {user.second_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{user.username}
                        </p>
                        {user.group && (
                          <p className="text-xs text-primary">{user.group}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/profile/${user.id}`)}
                        className="h-8 w-8"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No users found
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Newspaper className="w-5 h-5 mr-2 text-primary" />
                  News ({news.length})
                </div>
                <Dialog open={showCreateNews} onOpenChange={setShowCreateNews}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Create
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create News Article</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Title</label>
                        <Input
                          value={newNewsTitle}
                          onChange={(e) => setNewNewsTitle(e.target.value)}
                          placeholder="Enter news title..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Content</label>
                        <Textarea
                          value={newNewsContent}
                          onChange={(e) => setNewNewsContent(e.target.value)}
                          placeholder="Enter news content..."
                          rows={4}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Upload Media (Optional)
                        </label>
                        <Input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          onChange={(e) => setNewNewsFiles(e.target.files)}
                          className="transition-all duration-300 focus:shadow-md"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowCreateNews(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateNews}
                          disabled={
                            !newNewsTitle.trim() ||
                            !newNewsContent.trim() ||
                            isCreating
                          }
                        >
                          {isCreating ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Plus className="w-4 h-4 mr-2" />
                          )}
                          Create
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {news.length > 0 ? (
                news.map((item) => (
                  <div key={item.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-1 mb-1">
                          {item.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.text}
                        </p>
                        {item.media?.length ? (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {item.media.map((media, index) => (
                              <div
                                key={index}
                                className="relative rounded-lg overflow-hidden"
                              >
                                {media.type === "image" &&
                                !imageError[media.url] ? (
                                  <img
                                    src={`https://social.polito.uz/api/uploads/news-media/${media.url}`}
                                    alt="News media"
                                    className="w-full h-24 object-cover hover:scale-105 transition-transform duration-300"
                                    onError={() => handleImageError(media.url)}
                                  />
                                ) : media.type === "video" ? (
                                  <video
                                    src={normalizeUrl(media.url)}
                                    className="w-full h-24 object-cover"
                                    controls
                                  />
                                ) : (
                                  <div className="w-full h-24 bg-muted flex items-center justify-center">
                                    <span className="text-muted-foreground">
                                      Media unavailable
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteNews(item.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No news articles
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-16 flex flex-col space-y-2"
            onClick={() => navigate("/admin/activities")}
          >
            <Plus className="w-6 h-6" />
            <span>Manage Activities</span>
          </Button>

          <Button
            variant="outline"
            className="h-16 flex flex-col space-y-2"
            onClick={() => navigate("/user-search")}
          >
            <Users className="w-6 h-6" />
            <span>Browse Users</span>
          </Button>

          <Button
            variant="outline"
            className="h-16 flex flex-col space-y-2"
            onClick={() => navigate("/home")}
          >
            <Eye className="w-6 h-6" />
            <span>View Campus</span>
          </Button>

          <Button
            variant="outline"
            className="h-16 flex flex-col space-y-2"
            onClick={() => navigate("/admin/anonymous")}
          >
            <Eye className="w-6 h-6" />
            <span>View Anonymous</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
