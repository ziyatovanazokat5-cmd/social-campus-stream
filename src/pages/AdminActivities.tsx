import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Edit, 
  Loader2,
  Upload,
  X,
  Shield,
  Image as ImageIcon
} from 'lucide-react';

interface Activity {
  id: number;
  title: string;
  description: string;
  photos: string[];
  createdAt?: string;
}

const AdminActivities = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const normalizeUrl = (url: string) => {
    if (url?.startsWith('./')) {
      return `http://localhost:9000/${url.slice(2)}`;
    }
    return url?.startsWith('http') ? url : `http://localhost:9000/${url}`;
  };

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/activities', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setActivities(data.data || []);
      } else {
        toast({
          title: "Failed to load activities",
          description: data.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection error",
        description: "Unable to load activities. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/home');
      return;
    }
    if (token) {
      fetchActivities();
    }
  }, [token, user?.role]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + selectedFiles.length > 5) {
      toast({
        title: "Too many files",
        description: "You can only upload up to 5 photos per activity.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);
    
    // Create preview URLs
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      setPreviewUrls(prev => [...prev, url]);
    });
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateActivity = async () => {
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      
      selectedFiles.forEach((file) => {
        formData.append('photos', file);
      });

      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setActivities(prev => [data.data, ...prev]);
        setTitle('');
        setDescription('');
        setSelectedFiles([]);
        setPreviewUrls([]);
        setShowCreateModal(false);
        
        toast({
          title: "Activity created!",
          description: "New activity has been published successfully.",
        });
      } else {
        toast({
          title: "Failed to create activity",
          description: data.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to create activity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setActivities(prev => prev.filter(a => a.id !== activityId));
        toast({
          title: "Activity deleted",
          description: "Activity has been removed successfully.",
        });
      } else {
        toast({
          title: "Failed to delete activity",
          description: data.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to delete activity. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Shield className="w-8 h-8 mr-3 text-primary" />
              Admin Activities
            </h1>
            <p className="text-muted-foreground">
              Manage campus activities and events
            </p>
          </div>
          
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button variant="hero" className="flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Create Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Activity</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter activity title..."
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description *</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter activity description..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Photos (Optional)</label>
                  <div className="mt-1 space-y-4">
                    <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Click to upload photos (up to 5)
                        </span>
                      </label>
                    </div>

                    {/* Photo Previews */}
                    {previewUrls.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {previewUrls.map((url, index) => (
                          <div key={index} className="relative">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => removeFile(index)}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateActivity}
                    disabled={!title.trim() || !description.trim() || isCreating}
                    className="flex-1"
                  >
                    {isCreating ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Create Activity
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Activities Grid */}
        {activities.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <Card 
                key={activity.id}
                className="shadow-card border-0 bg-card/80 backdrop-blur-sm hover:shadow-elegant transition-all duration-300 animate-fade-in"
              >
                {/* Activity Photos */}
                {activity.photos && activity.photos.length > 0 && (
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img
                      src={normalizeUrl(activity.photos[0])}
                      alt={activity.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCA2MEgxNDBWMTQwSDYwVjYwWiIgZmlsbD0iI0U1RTdFQiIvPgo8L3N2Zz4K';
                      }}
                    />
                    {activity.photos.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        +{activity.photos.length - 1} more
                      </div>
                    )}
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="line-clamp-1">{activity.title}</span>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-muted-foreground line-clamp-3 text-sm">
                    {activity.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Created</span>
                    </div>
                    {activity.photos && activity.photos.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <ImageIcon className="w-4 h-4" />
                        <span>{activity.photos.length} photo{activity.photos.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Activities Created</h3>
              <p className="text-muted-foreground mb-6">
                Start by creating your first campus activity to engage students.
              </p>
              <Button variant="hero" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Activity
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Back to Admin Panel */}
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <Shield className="w-4 h-4 mr-2" />
            Back to Admin Panel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminActivities;