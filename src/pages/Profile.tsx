import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Edit, Save, X, User, Users, Heart, Loader2, ArrowLeft } from 'lucide-react';
import PostCard from '@/components/posts/PostCard';
import PostModal from '@/components/modals/PostModal';

interface UserProfile {
  id: string;
  first_name: string;
  second_name: string;
  third_name?: string;
  bio: string;
  username: string;
  group: string;
  profilePhoto: { url: string } | null;
  role: string;
  subscriptionsSent: Array<{ id: number }>;
  subscriptionsReceived: Array<{ id: number }>;
  posts: Array<{
    id: number;
    content: string;
    views: number;
    createdAt: string;
    likes: Array<{
      id: number;
      user: {
        id: string;
        first_name: string;
        second_name: string;
        username: string;
        profilePhoto: { url: string } | null;
      };
    }>;
  }>;
}

const Profile = () => {
  const { user, token, updateUser } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    first_name: '',
    second_name: '',
    third_name: '',
    bio: '',
    group: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
  const [currentModalPost, setCurrentModalPost] = useState<any>(null);

  const isOwnProfile = !id || id === user?.id;
  const displayUser = isOwnProfile ? user : profileData;

  useEffect(() => {
    if (id && id !== user?.id) {
      fetchProfile(id);
    } else if (user) {
      setProfileData(user as any);
      setEditData({
        first_name: user.first_name || '',
        second_name: user.second_name || '',
        third_name: user.third_name || '',
        bio: user.bio || '',
        group: user.group || ''
      });
    }
  }, [id, user]);

  const normalizeUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('./')) {
      return `http://localhost:9000/${url.slice(2)}`;
    }
    return url.startsWith('http') ? url : `http://localhost:9000/${url}`;
  };

  const fetchProfile = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:9000/users/one/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setProfileData(data.data);
        if (data.data.likes) {
          const likedIds = data.data.likes.map((like: any) => like.postId || like.post_id).filter(Boolean);
          setLikedPostIds(likedIds);
        }
      } else {
        toast({
          title: "Failed to load profile",
          description: data.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to load profile data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:9000/users/update', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      const data = await response.json();
      if (data.success) {
        // Fetch updated profile
        const profileResponse = await fetch('http://localhost:9000/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const profileData = await profileResponse.json();

        if (profileData.success) {
          updateUser(profileData.data);
          setIsEditing(false);
          toast({
            title: "Profile updated!",
            description: "Your profile information has been successfully updated.",
          });
        }
      } else {
        toast({
          title: "Update failed",
          description: data.message || "Unable to update profile. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection error",
        description: "Unable to update profile. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      first_name: user?.first_name || '',
      second_name: user?.second_name || '',
      third_name: user?.third_name || '',
      bio: user?.bio || '',
      group: user?.group || ''
    });
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value
    });
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

  const handleComment = (postId: number) => {
    const post = profileData?.posts?.find(p => p.id === postId);
    if (post) {
      setCurrentModalPost(post);
    }
  };

  const handleOpenPost = (postId: number) => {
    const post = profileData?.posts?.find(p => p.id === postId);
    if (post) {
      setCurrentModalPost(post);
    }
  };

  const handleNavigateToProfile = (userId: number | string) => {
    if (userId !== user?.id) {
      navigate(`/profile/${userId}`);
    }
  };

  if (isLoading && !displayUser) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Profile not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          {!isOwnProfile && (
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}

          {/* Profile Header */}
          <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  <Avatar className="w-32 h-32 ring-4 ring-primary/20">
                    <AvatarImage 
                      src={displayUser.profilePhoto?.url ? normalizeUrl(displayUser.profilePhoto.url) : ''} 
                      alt={displayUser.username}
                    />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-3xl font-bold">
                      {displayUser.first_name?.[0]}{displayUser.second_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Profile Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground">
                        {displayUser.first_name} {displayUser.second_name} {displayUser.third_name}
                      </h1>
                      <p className="text-xl text-muted-foreground">@{displayUser.username}</p>
                      {displayUser.role && (
                        <span className="inline-block px-3 py-1 mt-2 text-xs font-medium bg-primary/10 text-primary rounded-full">
                          {displayUser.role.charAt(0).toUpperCase() + displayUser.role.slice(1)}
                        </span>
                      )}
                    </div>
                    
                    {isOwnProfile && (
                      <div className="flex space-x-2">
                        {!isEditing ? (
                          <Button
                            variant="hero"
                            onClick={() => setIsEditing(true)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              onClick={handleCancel}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                            <Button
                              variant="hero"
                              onClick={handleSave}
                              disabled={isLoading}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm">
                        {(displayUser as any).subscriptionsReceived?.length || 0} Subscribers
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">
                        {(displayUser as any).subscriptionsSent?.length || 0} Following
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span className="text-sm">
                        {(displayUser as any).posts?.length || 0} Posts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Personal Information */}
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditing && isOwnProfile ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          value={editData.first_name}
                          onChange={handleChange}
                          className="transition-all duration-300 focus:shadow-md"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="second_name">Last Name</Label>
                        <Input
                          id="second_name"
                          name="second_name"
                          value={editData.second_name}
                          onChange={handleChange}
                          className="transition-all duration-300 focus:shadow-md"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="third_name">Middle Name</Label>
                      <Input
                        id="third_name"
                        name="third_name"
                        value={editData.third_name}
                        onChange={handleChange}
                        className="transition-all duration-300 focus:shadow-md"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="group">Study Group</Label>
                      <Input
                        id="group"
                        name="group"
                        value={editData.group}
                        onChange={handleChange}
                        placeholder="e.g., Computer Science Group A"
                        className="transition-all duration-300 focus:shadow-md"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={editData.bio}
                        onChange={handleChange}
                        placeholder="Tell us about yourself..."
                        className="transition-all duration-300 focus:shadow-md resize-none"
                        rows={4}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Full Name</h3>
                      <p className="text-foreground">
                        {displayUser.first_name} {displayUser.second_name} {displayUser.third_name}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Username</h3>
                      <p className="text-foreground">@{displayUser.username}</p>
                    </div>

                    {displayUser.group && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Study Group</h3>
                        <p className="text-foreground">{displayUser.group}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Bio</h3>
                      <p className="text-foreground">
                        {displayUser.bio || "No bio provided yet."}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Activity Summary */}
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
                        <p className="font-medium">Subscribers</p>
                        <p className="text-sm text-muted-foreground">People following you</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-red-500">
                      {(displayUser as any).subscriptionsReceived?.length || 0}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">Following</p>
                        <p className="text-sm text-muted-foreground">People you follow</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-blue-500">
                      {(displayUser as any).subscriptionsSent?.length || 0}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">Posts</p>
                        <p className="text-sm text-muted-foreground">Total posts shared</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-green-500">
                      {(displayUser as any).posts?.length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Posts */}
          {(displayUser as any).posts && (displayUser as any).posts.length > 0 && (
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>
                  {isOwnProfile ? 'My Posts' : `${displayUser.first_name}'s Posts`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {(displayUser as any).posts.map((post: any) => (
                    <PostCard
                      key={post.id}
                      post={{
                        ...post,
                        author: {
                          id: displayUser.id,
                          first_name: displayUser.first_name,
                          second_name: displayUser.second_name,
                          username: displayUser.username,
                          profilePhoto: displayUser.profilePhoto
                        },
                        comments: []
                      }}
                      currentUserId={user?.id || ''}
                      likedPostIds={likedPostIds}
                      onLike={handleLike}
                      onComment={handleComment}
                      onOpenPost={handleOpenPost}
                      onNavigateToProfile={handleNavigateToProfile}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
      </div>
    </div>
  );
};

export default Profile;