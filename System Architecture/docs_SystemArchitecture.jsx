import React from 'react';

/**
 * Fluenzy AI - System Architecture Visualization Component
 * Interactive React component showing the multi-channel application architecture
 */

const SystemArchitecture = () => {
  const [selectedLayer, setSelectedLayer] = React.useState(null);
  const [hoveredComponent, setHoveredComponent] = React.useState(null);

  const layers = {
    client: {
      name: 'Client Layer - Multi-Channel',
      color: 'bg-gradient-to-r from-purple-600 to-indigo-600',
      components: [
        {
          id: 'web',
          name: 'Web Application',
          tech: 'Next.js 15 + React 19',
          description: 'Server-side rendered web application with SEO optimization'
        },
        {
          id: 'mobile',
          name: 'Mobile Responsive',
          tech: 'Tailwind CSS v4',
          description: 'Fully responsive design for all device sizes'
        },
        {
          id: 'pwa',
          name: 'PWA Support',
          tech: 'Service Workers',
          description: 'Progressive Web App with offline capabilities'
        }
      ]
    },
    presentation: {
      name: 'Presentation Layer',
      color: 'bg-gradient-to-r from-pink-500 to-rose-500',
      components: [
        {
          id: 'landing',
          name: 'Landing Pages',
          tech: 'Hero, Features, Pricing, Blog',
          description: 'Marketing and informational pages'
        },
        {
          id: 'training',
          name: 'Training Modules',
          tech: 'English, HR, Technical, GD',
          description: 'Interactive training session interfaces'
        },
        {
          id: 'dashboard',
          name: 'User Dashboard',
          tech: 'Analytics, Progress, History',
          description: 'Comprehensive user performance tracking'
        },
        {
          id: 'profile',
          name: 'Profile Builder',
          tech: 'Resume, Skills, Projects',
          description: 'Professional profile and resume builder'
        },
        {
          id: 'components',
          name: 'Component Library',
          tech: 'ShadCN + Radix UI',
          description: '40+ reusable UI components'
        }
      ]
    },
    application: {
      name: 'Application Layer (Next.js API Routes)',
      color: 'bg-gradient-to-r from-cyan-500 to-blue-500',
      components: [
        {
          id: 'auth',
          name: 'Authentication API',
          tech: '/api/auth/* - NextAuth.js',
          description: 'User authentication and session management'
        },
        {
          id: 'session',
          name: 'Training Session API',
          tech: '/api/session, /api/evaluate',
          description: 'Training session CRUD and AI evaluation'
        },
        {
          id: 'payment',
          name: 'Payment API',
          tech: '/api/payment - Razorpay',
          description: 'Payment processing and subscription management'
        },
        {
          id: 'resume',
          name: 'Resume Builder API',
          tech: '/api/resume-pdf - Puppeteer',
          description: 'PDF generation for resumes and reports'
        },
        {
          id: 'analytics',
          name: 'Analytics API',
          tech: '/api/analytics, /api/stats',
          description: 'Performance metrics and analytics data'
        },
        {
          id: 'admin',
          name: 'Admin API',
          tech: '/api/admin/* - SuperAdmin',
          description: 'Administrative functions and user management'
        },
        {
          id: 'interview',
          name: 'Interview Guide API',
          tech: '/api/interview-guide',
          description: 'AI-generated interview preparation guides'
        }
      ]
    },
    middleware: {
      name: 'Middleware Layer',
      color: 'bg-gradient-to-r from-green-500 to-emerald-500',
      components: [
        {
          id: 'authmw',
          name: 'Authentication Middleware',
          tech: 'JWT Token Validation',
          description: 'Validates user sessions and tokens'
        },
        {
          id: 'rbac',
          name: 'Role-Based Access Control',
          tech: 'User/Admin/Moderator/SuperAdmin',
          description: 'Enforces role-based permissions'
        },
        {
          id: 'ratelimit',
          name: 'Rate Limiting',
          tech: 'Express Rate Limit',
          description: 'API throttling and DDoS protection'
        },
        {
          id: 'device',
          name: 'Device Detection',
          tech: 'User Agent Parsing',
          description: 'Tracks device, OS, browser, and location'
        }
      ]
    },
    business: {
      name: 'Business Logic Layer',
      color: 'bg-gradient-to-r from-orange-500 to-red-500',
      components: [
        {
          id: 'ai',
          name: 'AI/ML Services',
          tech: 'Google Gemini Pro',
          description: 'Natural language processing and speech-to-text'
        },
        {
          id: 'training-engine',
          name: 'Training Engine Modules',
          tech: '5 Training Modules',
          description: 'English, HR, Technical, GD, Mock Interview platforms'
        },
        {
          id: 'scoring',
          name: 'Scoring & Analytics Engine',
          tech: 'Multi-dimensional Scoring',
          description: 'Technical, Communication, Grammar, Confidence scoring'
        }
      ]
    },
    data: {
      name: 'Data Access Layer',
      color: 'bg-gradient-to-r from-teal-500 to-cyan-600',
      components: [
        {
          id: 'prisma',
          name: 'Prisma ORM v6.19.0',
          tech: 'MongoDB Client',
          description: 'Type-safe database access layer'
        },
        {
          id: 'models',
          name: 'Database Models',
          tech: '15+ Models',
          description: 'Users, Sessions, Payments, Profiles, etc.'
        }
      ]
    },
    persistence: {
      name: 'Persistence Layer',
      color: 'bg-gradient-to-r from-slate-600 to-gray-700',
      components: [
        {
          id: 'mongodb',
          name: 'MongoDB Atlas',
          tech: 'NoSQL Database',
          description: 'Primary data store with auto-scaling'
        },
        {
          id: 'imagekit',
          name: 'ImageKit CDN',
          tech: 'Image Management',
          description: 'Global CDN for image optimization'
        },
        {
          id: 'files',
          name: 'File Storage',
          tech: 'PDFs, Resumes',
          description: 'Generated documents and reports'
        }
      ]
    },
    external: {
      name: 'External Services',
      color: 'bg-gradient-to-r from-amber-500 to-yellow-500',
      components: [
        {
          id: 'nextauth',
          name: 'NextAuth.js',
          tech: 'Session Management',
          description: 'Authentication provider and session handling'
        },
        {
          id: 'razorpay',
          name: 'Razorpay',
          tech: 'Payment Gateway',
          description: 'Payment processing and subscriptions'
        },
        {
          id: 'google',
          name: 'Google OAuth 2.0',
          tech: 'Social Login',
          description: 'Third-party authentication'
        },
        {
          id: 'imagekit-ext',
          name: 'ImageKit.io',
          tech: 'CDN Service',
          description: 'External image CDN service'
        },
        {
          id: 'gemini',
          name: 'Google Gemini API',
          tech: 'AI Engine',
          description: 'Generative AI service'
        },
        {
          id: 'puppeteer',
          name: 'Puppeteer',
          tech: 'PDF Generation',
          description: 'Headless browser for PDF export'
        }
      ]
    }
  };

  const dataFlow = [
    { from: 'Client Layer', to: 'Presentation Layer', label: 'HTTP/HTTPS' },
    { from: 'Presentation Layer', to: 'Application Layer', label: 'API Requests' },
    { from: 'Application Layer', to: 'Middleware Layer', label: 'Route Protection' },
    { from: 'Middleware Layer', to: 'Business Logic Layer', label: 'Validated Requests' },
    { from: 'Business Logic Layer', to: 'Data Access Layer', label: 'Database Operations' },
    { from: 'Data Access Layer', to: 'Persistence Layer', label: 'Query/Store' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Fluenzy AI
          </h1>
          <h2 className="text-2xl text-cyan-400 mb-2">
            Multi-Channel Application Architecture
          </h2>
          <p className="text-slate-400 max-w-3xl mx-auto">
            Interactive visualization of the complete system architecture, 
            from client interfaces through business logic to data persistence
          </p>
        </div>

        {/* Architecture Layers */}
        <div className="space-y-6">
          {Object.entries(layers).