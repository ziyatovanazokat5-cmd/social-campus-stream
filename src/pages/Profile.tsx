import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Edit, Save, X, User, Mail, Users, Heart, MapPin } from 'lucide-react';

const Profile = () => {
  const { user, token, updateUser } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    first_name: '',
    second_name: '',
    third_name: '',
    bio: '',
    group: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setEditData({
        first_name: user.first_name || '',
        second_name: user.second_name || '',
        third_name: user.third_name || '',
        bio: user.bio || '',
        group: user.group || ''
      });
    }
  }, [user]);

  const normalizeUrl = (url: string) => {
    if (url?.startsWith('./')) {
      return `http://localhost:9000/${url.slice(2)}`;
    }
    return url?.startsWith('http') ? url : `http://localhost:9000/${url}`;
  };

  const fetchProfile = async (userId?: string) => {
    setIsLoading(true);
    try {
      const endpoint = userId ? `/api/users/${userId}` : '/api/users/profile';
      const response = await fetch(endpoint, {
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

  const fetchUserPosts = async (userId?: string) => {
    setIsLoadingPosts(true);
    try {
      const targetUserId = userId || user?.id;
      const response = await fetch(`/api/posts?userId=${targetUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setUserPosts(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch user posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users/update', {
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
        const profileResponse = await fetch('/api/users/profile', {
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  <Avatar className="w-32 h-32 ring-4 ring-primary/20">
                    <AvatarImage 
                      src={user.profilePhoto?.url ? normalizeUrl(user.profilePhoto.url) : ''} 
                      alt={user.username}
                    />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-3xl font-bold">
                      {user.first_name[0]}{user.second_name[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Profile Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground">
                        {user.first_name} {user.second_name} {user.third_name}
                      </h1>
                      <p className="text-xl text-muted-foreground">@{user.username}</p>
                      {user.role && (
                        <span className="inline-block px-3 py-1 mt-2 text-xs font-medium bg-primary/10 text-primary rounded-full">
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      )}
                    </div>
                    
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm">Liked {user.likes?.length || 0} posts</span>
                    </div>
                    {user.group && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{user.group}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span className="text-sm">Campus Student</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Personal Information */}
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditing ? (
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
                        {user.first_name} {user.second_name} {user.third_name}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Username</h3>
                      <p className="text-foreground">@{user.username}</p>
                    </div>

                    {user.group && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Study Group</h3>
                        <p className="text-foreground">{user.group}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Bio</h3>
                      <p className="text-foreground">
                        {user.bio || "No bio provided yet."}
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
                        <p className="font-medium">Posts Liked</p>
                        <p className="text-sm text-muted-foreground">Total interactions</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-red-500">
                      {user.likes?.length || 0}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">Group Member</p>
                        <p className="text-sm text-muted-foreground">Study group participation</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-blue-500">
                      {user.group ? 'Active' : 'None'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">Account Status</p>
                        <p className="text-sm text-muted-foreground">Campus community member</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-green-500">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;