# WordWave - Interactive Flashcard Learning Application

## Overview

WordWave is a modern educational web application designed to help students learn sight words through interactive flashcards. The application features multimedia content including GIFs, audio pronunciation, speech recognition, and AI-powered content generation. It supports role-based access for students, teachers, and administrators, with comprehensive progress tracking and classroom management capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built using React with TypeScript, leveraging Vite for development and build tooling. The UI framework is built on top of shadcn/ui components with Radix UI primitives, styled using Tailwind CSS with a custom design system featuring primary blue, secondary orange, and accent yellow colors. The application uses Wouter for client-side routing and TanStack Query for state management and API communication.

Key architectural decisions:
- **Component-based architecture**: Modular React components with clear separation of concerns
- **TypeScript integration**: Full type safety across the frontend with shared schema validation
- **Responsive design**: Mobile-first approach with bottom navigation for student interface
- **Custom CSS animations**: Flashcard flip animations and audio wave visualizations

### Backend Architecture
The server is built on Express.js with TypeScript, implementing a RESTful API design. Authentication is handled using Passport.js with local strategy and express-session for session management. The application follows a layered architecture with separate modules for routes, authentication, storage, and AI integration.

Key components:
- **Route handlers**: RESTful endpoints for flashcards, progress tracking, user management, and AI features
- **Authentication middleware**: Session-based authentication with role-based access control
- **Storage abstraction**: Interface-based storage layer for database operations
- **AI integration**: OpenAI GPT-4o integration for automated flashcard generation

### Database Design
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The schema supports multi-tenancy through role-based access control and comprehensive progress tracking.

Core entities:
- **Users and Roles**: Three-tier role system (student, teacher, admin)
- **Flashcard Sets and Cards**: Hierarchical content organization with multimedia support
- **Progress Tracking**: Individual flashcard mastery and set completion tracking
- **Activity Logging**: Comprehensive user activity monitoring
- **Set Assignments**: Teacher-to-student content assignment system

### Authentication and Authorization
The system implements session-based authentication with role-based access control. Password security uses scrypt hashing with salt, and sessions are stored server-side with configurable expiration. Role-based routing ensures users only access appropriate interface sections.

Security features:
- **Password hashing**: Scrypt with random salt generation
- **Session management**: Server-side session storage with PostgreSQL
- **Role-based access**: Three-tier permission system
- **CSRF protection**: Built into session configuration

## External Dependencies

### Database and Storage
- **PostgreSQL**: Primary database via Neon serverless
- **Drizzle ORM**: Type-safe database operations and migrations
- **Express-session with connect-pg-simple**: Session storage in PostgreSQL

### AI and Content Generation
- **OpenAI GPT-4o**: Automated flashcard content generation including definitions, examples, and syllable breakdowns
- **Web Speech API**: Browser-native speech recognition and text-to-speech functionality

### UI and Styling
- **shadcn/ui**: Pre-built component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Radix UI**: Accessible component primitives for complex UI interactions
- **Lucide React**: Icon library for consistent iconography

### Development and Build Tools
- **Vite**: Frontend build tooling with React plugin
- **TypeScript**: Type safety across frontend and backend
- **React Hook Form**: Form validation with Zod schema integration
- **TanStack Query**: Server state management and caching

### Authentication and Security
- **Passport.js**: Authentication middleware with local strategy
- **bcrypt/scrypt**: Password hashing for user security
- **CORS**: Cross-origin resource sharing configuration

The application is designed to scale horizontally with its modular architecture and can easily integrate additional AI providers or storage solutions through its abstraction layers.