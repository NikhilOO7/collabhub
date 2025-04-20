import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  AppBar,
  Toolbar,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  useTheme,
  CssBaseline,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Chat as ChatIcon,
  VideoCall as VideoCallIcon,
  Task as TaskIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Animated typing text component
const TypedText = ({ texts, delay = 3000 }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    const text = texts[currentTextIndex];
    
    if (isDeleting) {
      // Deleting text
      if (currentText === '') {
        setIsDeleting(false);
        setCurrentTextIndex((currentTextIndex + 1) % texts.length);
        setTypingSpeed(150);
      } else {
        // Delete a character
        const timeoutId = setTimeout(() => {
          setCurrentText(currentText.slice(0, -1));
        }, typingSpeed / 2);
        return () => clearTimeout(timeoutId);
      }
    } else {
      // Typing text
      if (currentText === text) {
        // Pause at the end of the text
        const timeoutId = setTimeout(() => {
          setIsDeleting(true);
        }, delay);
        return () => clearTimeout(timeoutId);
      } else {
        // Add a character
        const timeoutId = setTimeout(() => {
          setCurrentText(text.substring(0, currentText.length + 1));
        }, typingSpeed);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [currentText, currentTextIndex, isDeleting, texts, delay, typingSpeed]);

  return (
    <Typography 
      variant="h3" 
      component="span" 
      sx={{ 
        color: 'primary.main',
        display: 'inline-block',
        minWidth: { xs: '100%', md: '500px' },
        minHeight: { xs: '80px', md: '45px' },
        position: 'relative'
      }}
    >
      {currentText}
      <Box 
        component="span" 
        sx={{ 
          borderRight: '0.1em solid',
          borderColor: 'primary.main',
          position: 'absolute',
          right: '-0.1em',
          height: '100%',
          animation: 'blink-caret 0.75s step-end infinite'
        }}
      />
    </Typography>
  );
};

// Feature card component
const FeatureCard = ({ icon, title, description }) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: theme.shadows[10],
        },
      }}
      elevation={2}
    >
      <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 2 
          }}
        >
          {icon}
        </Box>
        <Typography gutterBottom variant="h5" component="h2">
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};

// Testimonial component
const Testimonial = ({ quote, author, role, company, avatar }) => {
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 2,
      }}
      elevation={1}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Typography 
          variant="body1" 
          gutterBottom 
          sx={{ 
            fontStyle: 'italic',
            mb: 2,
            position: 'relative',
            '&:before': {
              content: '"""',
              fontSize: '2rem',
              position: 'absolute',
              left: -15,
              top: -10,
              opacity: 0.3,
            },
            '&:after': {
              content: '"""',
              fontSize: '2rem',
              position: 'absolute',
              right: -15,
              bottom: -30,
              opacity: 0.3,
            },
          }}
        >
          {quote}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <Avatar src={avatar} alt={author} sx={{ mr: 2 }} />
          <Box>
            <Typography variant="subtitle1" component="p">
              {author}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {role}, {company}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const LandingPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Typed text options
  const typedTexts = [
    "Collaborate on tasks",
    "Chat in real-time",
    "Host video meetings",
    "Share files securely",
    "Manage projects efficiently"
  ];
  
  // Features data
  const features = [
    {
      icon: <ChatIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: "Real-time Chat",
      description: "Communicate with your team instantly. Send messages, share files, and organize conversations by channels."
    },
    {
      icon: <VideoCallIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: "Video Conferencing",
      description: "Host virtual meetings with screen sharing, chat, and recording capabilities to enhance remote collaboration."
    },
    {
      icon: <TaskIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: "Task Management",
      description: "Create, assign, and track tasks with customizable Kanban boards. Set due dates, priorities, and monitor progress."
    },
    {
      icon: <PeopleIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: "Team Workspaces",
      description: "Organize your work by teams and projects. Control access and keep everything in one secure location."
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: "Advanced Security",
      description: "End-to-end encryption and role-based permissions ensure your data stays private and secure."
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: "AI-Powered Assistant",
      description: "Boost productivity with AI that summarizes discussions, schedules meetings, and automates routine tasks."
    }
  ];
  
  // Testimonials data
  const testimonials = [
    {
      quote: "CollabHub transformed how our remote team works together. It's like having everyone in the same room.",
      author: "Sarah Johnson",
      role: "Product Manager",
      company: "Acme Inc.",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg"
    },
    {
      quote: "The integrated tools save us hours every week. We've significantly reduced our need for multiple subscriptions.",
      author: "Michael Chen",
      role: "CTO",
      company: "TechStart Labs",
      avatar: "https://randomuser.me/api/portraits/men/54.jpg"
    },
    {
      quote: "The AI features help us stay focused on meaningful work instead of administration. Game changer!",
      author: "Priya Patel",
      role: "Team Lead",
      company: "Global Solutions",
      avatar: "https://randomuser.me/api/portraits/women/37.jpg"
    }
  ];
  
  // Package pricing data
  const packages = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      features: [
        "Up to 10 team members",
        "5GB storage",
        "Real-time chat",
        "Task board",
        "Limited video calls (20 min)",
        "Community support"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Team",
      price: "$12",
      period: "per user/month",
      features: [
        "Unlimited team members",
        "50GB storage",
        "Advanced chat features",
        "Full task management",
        "Unlimited video calls",
        "Priority support",
        "AI assistant features"
      ],
      cta: "Try Free for 14 Days",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact sales",
      features: [
        "Dedicated server",
        "Unlimited storage",
        "Premium support",
        "Custom integrations",
        "Advanced security",
        "Admin controls",
        "Usage analytics"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];
  
  // Navigation items
  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];
  
  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const handleLogin = () => {
    navigate('/login');
  };
  
  const handleSignup = () => {
    navigate('/register');
  };
  
  const handleNavItemClick = (href) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <CssBaseline />
      {/* Header/Navigation */}
      <AppBar position="sticky" color="default" elevation={0} sx={{ bgcolor: 'background.paper' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Logo */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
            }}
          >
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(90deg, #3f51b5 0%, #f50057 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
              }}
            >
              CollabHub
            </Typography>
          </Box>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ mr: 4 }}>
                {navItems.map((item) => (
                  <Button 
                    key={item.label}
                    color="inherit"
                    onClick={() => handleNavItemClick(item.href)}
                    sx={{ mx: 1 }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
              
              <Box>
                <Button 
                  color="inherit"
                  onClick={handleLogin}
                  sx={{ mr: 2 }}
                >
                  Login
                </Button>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleSignup}
                >
                  Sign Up Free
                </Button>
              </Box>
            </Box>
          )}
          
          {/* Mobile Menu Toggle */}
          {isMobile && (
            <IconButton 
              edge="end" 
              color="inherit" 
              aria-label="menu"
              onClick={handleMobileMenuToggle}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>
      
      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleMobileMenuToggle}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
            <Typography variant="h6">Menu</Typography>
            <IconButton onClick={handleMobileMenuToggle}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          <List>
            {navItems.map((item) => (
              <ListItem 
                button 
                key={item.label}
                onClick={() => handleNavItemClick(item.href)}
              >
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Button 
              fullWidth 
              variant="outlined" 
              color="primary" 
              onClick={handleLogin}
              sx={{ mb: 1 }}
            >
              Login
            </Button>
            <Button 
              fullWidth 
              variant="contained" 
              color="primary"
              onClick={handleSignup}
            >
              Sign Up Free
            </Button>
          </Box>
        </Box>
      </Drawer>
      
      {/* Hero Section */}
      <Box 
        sx={{
          bgcolor: 'background.paper',
          pt: { xs: 6, md: 12 },
          pb: { xs: 8, md: 16 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Pattern */}
        <Box 
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(63,81,181,0.1) 0%, rgba(245,0,87,0.05) 70%, rgba(0,0,0,0) 100%)',
            zIndex: 0,
          }}
        />
        <Box 
          sx={{
            position: 'absolute',
            bottom: -50,
            left: -50,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,0,87,0.1) 0%, rgba(63,81,181,0.05) 70%, rgba(0,0,0,0) 100%)',
            zIndex: 0,
          }}
        />
        
        <Container 
          maxWidth="lg" 
          sx={{ 
            position: 'relative', 
            zIndex: 1,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Hero Text Content */}
          <Box 
            sx={{ 
              maxWidth: { xs: '100%', md: '55%' }, 
              textAlign: { xs: 'center', md: 'left' },
              mb: { xs: 4, md: 0 }, 
            }}
          >
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '2.5rem', md: '3.5rem' } 
              }}
            >
              One platform for 
              <br />
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                <TypedText texts={typedTexts} />
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
                <TypedText texts={typedTexts} />
              </Box>
            </Typography>
            
            <Typography 
              variant="h6" 
              color="text.secondary" 
              paragraph
              sx={{ mb: 4 }}
            >
              CollabHub brings your team's communication, tasks, and meetings into one seamless platform.
              Streamlined collaboration and AI-powered productivity in a secure workspace.
            </Typography>
            
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: { xs: 'center', md: 'flex-start' }, 
                gap: 2,
              }}
            >
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                onClick={handleSignup}
                sx={{ 
                  py: 1.5, 
                  px: 4, 
                  borderRadius: 2,
                  fontWeight: 'bold',
                }}
              >
                Get Started Free
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                size="large"
                sx={{ 
                  py: 1.5, 
                  px: 4, 
                  borderRadius: 2,
                }}
              >
                View Demo
              </Button>
            </Box>
          </Box>
          
          {/* Hero Image */}
          <Box 
            sx={{ 
              width: { xs: '100%', md: '45%' }, 
              position: 'relative',
            }}
          >
            <Box
              component="img"
              src="/app-screenshot.png"
              alt="CollabHub Dashboard"
              sx={{
                width: '100%',
                maxWidth: 600,
                height: 'auto',
                borderRadius: 4,
                boxShadow: theme.shadows[10],
                transform: 'perspective(1000px) rotateY(-10deg)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'perspective(1000px) rotateY(-5deg) translateY(-10px)',
                  boxShadow: theme.shadows[15],
                },
              }}
            />
            {/* Placeholder if image is not available */}
            <Box 
              sx={{ 
                display: 'none', // Change to 'flex' if image is not available
                width: '100%',
                height: { xs: 250, md: 400 },
                bgcolor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: 4,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h6" color="text.secondary">
                App Screenshot
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
      
      {/* Features Section */}
      <Box 
        id="features" 
        sx={{ 
          py: { xs: 6, md: 10 },
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.02)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              Features That Empower Teams
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ maxWidth: 800, mx: 'auto' }}
            >
              All the tools your team needs to communicate, collaborate, and coordinate in one unified platform.
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <FeatureCard 
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
      
      {/* Testimonials Section */}
      <Box 
        id="testimonials" 
        sx={{ 
          py: { xs: 6, md: 10 },
          bgcolor: 'background.paper',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              What Teams Say About Us
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ maxWidth: 800, mx: 'auto' }}
            >
              Thousands of teams use CollabHub to streamline their workflows and enhance productivity.
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Testimonial 
                  quote={testimonial.quote}
                  author={testimonial.author}
                  role={testimonial.role}
                  company={testimonial.company}
                  avatar={testimonial.avatar}
                />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
      
      {/* Pricing Section */}
      <Box 
        id="pricing" 
        sx={{ 
          py: { xs: 6, md: 10 },
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.02)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              Simple, Transparent Pricing
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ maxWidth: 800, mx: 'auto' }}
            >
              Choose the plan that fits your team's needs. All plans include core collaboration features.
            </Typography>
          </Box>
          
          <Grid container spacing={4} justifyContent="center">
            {packages.map((pkg, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    position: 'relative',
                    border: pkg.popular ? `2px solid ${theme.palette.primary.main}` : 'none',
                    transform: pkg.popular ? 'scale(1.05)' : 'none',
                    zIndex: pkg.popular ? 1 : 0,
                    boxShadow: pkg.popular ? theme.shadows[10] : theme.shadows[1],
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: pkg.popular ? 'scale(1.08)' : 'scale(1.03)',
                      boxShadow: theme.shadows[10],
                    },
                  }}
                  elevation={pkg.popular ? 10 : 1}
                >
                  {pkg.popular && (
                    <Box 
                      sx={{
                        position: 'absolute',
                        top: 10,
                        right: 0,
                        bgcolor: 'primary.main',
                        color: 'white',
                        py: 0.5,
                        px: 2,
                        borderTopLeftRadius: 4,
                        borderBottomLeftRadius: 4,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Most Popular
                      </Typography>
                    </Box>
                  )}
                  
                  <CardContent sx={{ p: 3, flexGrow: 1 }}>
                    <Typography 
                      variant="h5" 
                      component="h3" 
                      gutterBottom
                      sx={{ fontWeight: 'bold' }}
                    >
                      {pkg.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 3 }}>
                      <Typography 
                        variant="h3" 
                        component="span"
                        sx={{ fontWeight: 'bold' }}
                      >
                        {pkg.price}
                      </Typography>
                      <Typography 
                        variant="subtitle1" 
                        component="span" 
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        /{pkg.period}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ mb: 4 }}>
                      {pkg.features.map((feature, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box 
                            component="span" 
                            sx={{ 
                              display: 'inline-block',
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              mr: 1.5,
                            }}
                          />
                          <Typography variant="body1">
                            {feature}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                  
                  <Box sx={{ p: 3, pt: 0 }}>
                    <Button 
                      fullWidth 
                      variant={pkg.popular ? "contained" : "outlined"} 
                      color="primary"
                      size="large"
                      onClick={handleSignup}
                      sx={{ 
                        py: 1.5,
                        borderRadius: 2,
                      }}
                    >
                      {pkg.cta}
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
      
      {/* Call to Action Section */}
      <Box 
        sx={{ 
          py: { xs: 8, md: 12 },
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Pattern */}
        <Box 
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 70%, rgba(0,0,0,0) 100%)',
            zIndex: 0,
          }}
        />
        <Box 
          sx={{
            position: 'absolute',
            bottom: -50,
            left: -50,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 70%, rgba(0,0,0,0) 100%)',
            zIndex: 0,
          }}
        />
        
        <Container 
          maxWidth="md" 
          sx={{ 
            position: 'relative',
            zIndex: 1,
            textAlign: 'center',
          }}
        >
          <Typography 
            variant="h3" 
            component="h2" 
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            Start Collaborating Today
          </Typography>
          <Typography 
            variant="h6" 
            paragraph
            sx={{ mb: 4, opacity: 0.9 }}
          >
            Join thousands of teams already using CollabHub to boost their productivity and streamline communication.
          </Typography>
          <Box>
            <Button 
              variant="contained" 
              color="secondary" 
              size="large"
              onClick={handleSignup}
              sx={{ 
                py: 1.5, 
                px: 4, 
                borderRadius: 2,
                fontWeight: 'bold',
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)',
                },
              }}
            >
              Get Started Free
            </Button>
            <Typography 
              variant="body2" 
              sx={{ mt: 2, opacity: 0.7 }}
            >
              No credit card required. Free plan available forever.
            </Typography>
          </Box>
        </Container>
      </Box>
      
      {/* Footer Section */}
      <Box 
        component="footer" 
        sx={{ 
          py: 6,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography 
                variant="h6" 
                component="h3" 
                gutterBottom
                sx={{ fontWeight: 'bold' }}
              >
                CollabHub
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                All-in-one collaboration platform for teams of all sizes.
                Communicate, collaborate, and coordinate in one unified workspace.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  &copy; {new Date().getFullYear()} CollabHub. All rights reserved.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3} md={2}>
              <Typography variant="subtitle1" gutterBottom>
                Product
              </Typography>
              <Box component="ul" sx={{ pl: 0, listStyle: 'none' }}>
                {['Features', 'Pricing', 'Integrations', 'Updates', 'Security'].map((item) => (
                  <Box component="li" key={item} sx={{ mb: 1 }}>
                    <Button color="inherit" sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}>
                      {item}
                    </Button>
                  </Box>
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3} md={2}>
              <Typography variant="subtitle1" gutterBottom>
                Resources
              </Typography>
              <Box component="ul" sx={{ pl: 0, listStyle: 'none' }}>
                {['Documentation', 'Tutorials', 'Blog', 'API', 'Community'].map((item) => (
                  <Box component="li" key={item} sx={{ mb: 1 }}>
                    <Button color="inherit" sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}>
                      {item}
                    </Button>
                  </Box>
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3} md={2}>
              <Typography variant="subtitle1" gutterBottom>
                Company
              </Typography>
              <Box component="ul" sx={{ pl: 0, listStyle: 'none' }}>
                {['About', 'Careers', 'Contact', 'Privacy', 'Terms'].map((item) => (
                  <Box component="li" key={item} sx={{ mb: 1 }}>
                    <Button color="inherit" sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}>
                      {item}
                    </Button>
                  </Box>
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3} md={2}>
              <Typography variant="subtitle1" gutterBottom>
                Support
              </Typography>
              <Box component="ul" sx={{ pl: 0, listStyle: 'none' }}>
                {['Help Center', 'Status', 'FAQ', 'Contact Us', 'Feedback'].map((item) => (
                  <Box component="li" key={item} sx={{ mb: 1 }}>
                    <Button color="inherit" sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}>
                      {item}
                    </Button>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

export default LandingPage;