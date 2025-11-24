/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Calendar, MapPin, Users, Clock, Loader2, CheckCircle } from 'lucide-react';

interface Activity {
  id: number;
  title: string;
  description: string;
  photos: string[];
}

const Activities = () => {
  const { token } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [registering, setRegistering] = useState<{[key: number]: boolean}>({});

  const normalizeUrl = (url: string) => {
    if (url?.startsWith('./')) {
      return `https://social.polito.uz/api/${url.slice(2)}`;
    }
    return url?.startsWith('https') ? url : `https://social.polito.uz/api/${url}`;
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch('https://social.polito.uz/api/activities', {
        headers: {
          'Authorization': `${token}`,
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
    if (token) {
      fetchActivities();
    }
  }, [token]);

  const handleRegister = async (activityId: number) => {
    setRegistering(prev => ({ ...prev, [activityId]: true }));
    
    try {
      const response = await fetch(`https://social.polito.uz/api/activities/${activityId}/register`, {
        method: 'POST',
        headers: {
          'Authorization': `${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Registration successful!",
          description: "You have been registered for this activity.",
        });
      } else {
        toast({
          title: "Registration failed",
          description: data.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to register for activity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRegistering(prev => ({ ...prev, [activityId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading campus activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Campus Activities</h1>
          <p className="text-muted-foreground">
            Discover and join exciting events happening around campus
          </p>
        </div>

        {/* Activities Grid */}
        {activities.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <Card 
                key={activity.id} 
                className="shadow-card border-0 bg-card/80 backdrop-blur-sm hover:shadow-elegant transition-all duration-300 transform hover:scale-105 animate-fade-in"
              >
                {/* Activity Photos */}
                {activity.photos && activity.photos.length > 0 && (
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img
                      src={`https://social.polito.uz/api/uploads/activities/${activity.photos[0]}`}
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
                  <CardTitle className="text-xl">{activity.title}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-muted-foreground line-clamp-3">
                    {activity.description}
                  </p>

                  {/* Activity Details */}
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Registration Open</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>Campus Venue</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Open to all students</span>
                    </div>
                  </div>

                  <Button
                    variant="hero"
                    className="w-full"
                    onClick={() => handleRegister(activity.id)}
                    disabled={registering[activity.id]}
                  >
                    {registering[activity.id] ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Register Now
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Activities Available</h3>
              <p className="text-muted-foreground">
                There are currently no campus activities scheduled. Check back later for upcoming events!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Activities;