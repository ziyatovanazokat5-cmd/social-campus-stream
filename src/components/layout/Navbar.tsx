import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { User, Home, Activity, MessageCircle, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  if (!user) {
    return (
      <nav className="bg-card/80 backdrop-blur-lg border-b border-border shadow-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CS</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Campus Stream
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/login')}
                className="transition-all duration-300"
              >
                Login
              </Button>
              <Button 
                variant="hero" 
                onClick={() => navigate('/register')}
                className="transition-all duration-300"
              >
                Join Campus
              </Button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-card/80 backdrop-blur-lg border-b border-border shadow-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">CS</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Campus Stream
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant={isActive('/home') ? 'hero' : 'ghost'} 
              size="sm"
              onClick={() => navigate('/home')}
              className="transition-all duration-300"
            >
              <Home className="w-4 h-4" />
              Home
            </Button>
            <Button 
              variant={isActive('/activities') ? 'hero' : 'ghost'} 
              size="sm"
              onClick={() => navigate('/activities')}
              className="transition-all duration-300"
            >
              <Activity className="w-4 h-4" />
              Activities
            </Button>
            <Button 
              variant={isActive('/chat') ? 'hero' : 'ghost'} 
              size="sm"
              onClick={() => navigate('/chat')}
              className="transition-all duration-300"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </Button>
            <Button 
              variant={isActive('/profile') ? 'hero' : 'ghost'} 
              size="sm"
              onClick={() => navigate('/profile')}
              className="transition-all duration-300"
            >
              <User className="w-4 h-4" />
              Profile
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="text-destructive hover:text-destructive-foreground hover:bg-destructive transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;