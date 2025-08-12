import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Users, MessageSquare, Calendar, Star } from 'lucide-react';
import campusHero from '@/assets/campus-hero.jpg';
import campusStudy from '@/assets/campus-study.jpg';
import campusLecture from '@/assets/campus-lecture.jpg';

const Landing = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      navigate('/home');
    }
  }, [token, navigate]);

  const features = [
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Connect with Students",
      description: "Build meaningful connections with your fellow students and expand your network."
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-accent" />,
      title: "Share & Discover",
      description: "Share your thoughts, discover interesting content, and stay updated with campus life."
    },
    {
      icon: <Calendar className="w-8 h-8 text-success" />,
      title: "Campus Events",
      description: "Never miss out on exciting campus activities, workshops, and social events."
    }
  ];

  const campusImages = [
    { src: campusHero, alt: "Campus Main Building" },
    { src: campusStudy, alt: "Students Studying" },
    { src: campusLecture, alt: "Lecture Hall" }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  Your Campus
                  <span className="bg-gradient-hero bg-clip-text text-transparent"> Community</span>
                  <br />Awaits
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg">
                  Connect, share, and thrive in your university community. 
                  Join Campus Stream to discover events, make friends, and stay engaged.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="premium" 
                  size="lg"
                  onClick={() => navigate('/register')}
                  className="text-lg px-8 py-6"
                >
                  Join Campus Stream
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="text-lg px-8 py-6"
                >
                  Sign In
                </Button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>Trusted by 10,000+ students</span>
                </div>
              </div>
            </div>

            <div className="relative animate-scale-in">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <img 
                    src={campusImages[0].src} 
                    alt={campusImages[0].alt}
                    className="rounded-xl shadow-card hover:shadow-elegant transition-all duration-300 transform hover:scale-105"
                  />
                  <img 
                    src={campusImages[1].src} 
                    alt={campusImages[1].alt}
                    className="rounded-xl shadow-card hover:shadow-elegant transition-all duration-300 transform hover:scale-105"
                  />
                </div>
                <div className="pt-8">
                  <img 
                    src={campusImages[2].src} 
                    alt={campusImages[2].alt}
                    className="rounded-xl shadow-card hover:shadow-elegant transition-all duration-300 transform hover:scale-105"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background/50">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold">Why Choose Campus Stream?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our university fosters community through posts, events, and meaningful connections
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="p-6 hover:shadow-card transition-all duration-300 transform hover:scale-105 animate-fade-in border-0 bg-card/50 backdrop-blur-sm"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <CardContent className="p-0 space-y-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-subtle rounded-xl">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-4xl font-bold text-primary-foreground">
              Ready to Join Your Campus Community?
            </h2>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Start connecting with your fellow students and discover everything your campus has to offer.
            </p>
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => navigate('/register')}
              className="text-lg px-8 py-6 bg-background text-foreground hover:bg-background/90"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;