import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  Home, 
  Activity, 
  MessageCircle, 
  LogOut, 
  Search, 
  Settings, 
  Shield,
  Menu,
  X,
  Users
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
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
              variant={isActive('/user-search') ? 'hero' : 'ghost'} 
              size="sm"
              onClick={() => navigate('/user-search')}
              className="transition-all duration-300"
            >
              <Search className="w-4 h-4" />
              Search
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
              variant={isActive('/anonymous') ? 'hero' : 'ghost'} 
              size="sm"
              onClick={() => navigate('/anonymous')}
              className="transition-all duration-300"
            >
              Anonymous
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

            {/* Admin Panel for Admins */}
            {user?.role === 'admin' && (
              <Button 
                variant={isActive('/admin') ? 'hero' : 'ghost'} 
                size="sm"
                onClick={() => navigate('/admin')}
                className="transition-all duration-300"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Button>
            )}

            <Button 
              variant={isActive('/settings') ? 'hero' : 'ghost'} 
              size="sm"
              onClick={() => navigate('/settings')}
              className="transition-all duration-300"
            >
              <Settings className="w-4 h-4" />
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

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="md:hidden mt-4 pb-4 border-t border-border">
            <div className="flex flex-col space-y-2 pt-4">
              <Button 
                variant={isActive('/home') ? 'hero' : 'ghost'} 
                onClick={() => {navigate('/home'); setShowMobileMenu(false);}}
                className="justify-start"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button 
                variant={isActive('/user-search') ? 'hero' : 'ghost'} 
                onClick={() => {navigate('/user-search'); setShowMobileMenu(false);}}
                className="justify-start"
              >
                <Search className="w-4 h-4 mr-2" />
                Search Users
              </Button>
              <Button 
                variant={isActive('/activities') ? 'hero' : 'ghost'} 
                onClick={() => {navigate('/activities'); setShowMobileMenu(false);}}
                className="justify-start"
              >
                <Activity className="w-4 h-4 mr-2" />
                Activities
              </Button>
              <Button 
                variant={isActive('/anonymous') ? 'hero' : 'ghost'} 
                onClick={() => {navigate('/anonymous'); setShowMobileMenu(false);}}
                className="justify-start"
              >
                Anonymous
              </Button>
              <Button 
                variant={isActive('/chat') ? 'hero' : 'ghost'} 
                onClick={() => {navigate('/chat'); setShowMobileMenu(false);}}
                className="justify-start"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
              <Button 
                variant={isActive('/profile') ? 'hero' : 'ghost'} 
                onClick={() => {navigate('/profile'); setShowMobileMenu(false);}}
                className="justify-start"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>

              {user?.role === 'admin' && (
                <Button 
                  variant={isActive('/admin') ? 'hero' : 'ghost'} 
                  onClick={() => {navigate('/admin'); setShowMobileMenu(false);}}
                  className="justify-start"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              )}

              <Button 
                variant={isActive('/settings') ? 'hero' : 'ghost'} 
                onClick={() => {navigate('/settings'); setShowMobileMenu(false);}}
                className="justify-start"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>

              <Button 
                variant="ghost" 
                onClick={() => {handleLogout(); setShowMobileMenu(false);}}
                className="justify-start text-destructive hover:text-destructive-foreground hover:bg-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;