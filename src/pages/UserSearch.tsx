import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface User {
  id: number;
  first_name: string;
  second_name: string;
  third_name?: string;
  username: string;
  bio: string;
  group: string;
  profilePhoto: { url: string } | null;
}

const UserSearch = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const normalizeUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('./')) {
      return `http://localhost:9000/${url.slice(2)}`;
    }
    return url.startsWith('http') ? url : `http://localhost:9000/${url}`;
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:9000/users', {
        headers: {
          'Authorization': `${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        // Filter out current user
        const otherUsers = (data.data || []).filter((u: User) => u.id.toString() !== user?.id);
        setUsers(otherUsers);
        setFilteredUsers(otherUsers);
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

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (
          user.first_name.toLowerCase().includes(searchLower) ||
          user.second_name.toLowerCase().includes(searchLower) ||
          user.third_name?.toLowerCase().includes(searchLower) ||
          user.username.toLowerCase().includes(searchLower) ||
          user.bio.toLowerCase().includes(searchLower)
        );
      });
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const handleUserClick = (userId: number) => {
    navigate(`/profile/${userId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Campus Members</h1>
          <p className="text-muted-foreground">
            Connect with fellow students and discover your campus community
          </p>
        </div>

        {/* Search Bar */}
        <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm mb-8">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, username, bio, or study group..."
                className="pl-12 text-lg h-12 border-0 bg-muted/50 focus-visible:ring-0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Grid */}
        {filteredUsers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <Card 
                key={user.id}
                className="shadow-card border-0 bg-card/80 backdrop-blur-sm hover:shadow-elegant transition-all duration-300 cursor-pointer transform hover:scale-105 animate-fade-in"
                onClick={() => handleUserClick(user.id)}
              >
                <CardContent className="p-6 text-center space-y-4">
                  <Avatar className="w-20 h-20 mx-auto ring-4 ring-primary/20">
                    <AvatarImage src={normalizeUrl(user.profilePhoto?.url)} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl">
                      {user.first_name[0]}{user.second_name[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      {user.first_name} {user.second_name}
                      {user.third_name && ` ${user.third_name}`}
                    </h3>
                    <p className="text-primary font-medium">@{user.username}</p>
                    
                    {user.group && (
                      <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                        {user.group}
                      </div>
                    )}
                  </div>

                  {user.bio && (
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {user.bio}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              {searchTerm ? (
                <>
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No users found</h3>
                  <p className="text-muted-foreground">
                    No users match your search "{searchTerm}". Try a different search term.
                  </p>
                </>
              ) : (
                <>
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No users available</h3>
                  <p className="text-muted-foreground">
                    There are currently no other users to display.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserSearch;