# Replit.md - 3D Canvas Game Application

## Overview

This is a full-stack Express.js and React application that appears to be designed for 3D games or interactive experiences. The project uses React Three Fiber for 3D rendering, Drizzle ORM with PostgreSQL for data persistence, and a modern UI component library (shadcn/ui). The architecture supports both a traditional brick breaker game (served at `/game`) and a more sophisticated 3D React application as the main interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the main application
- **React Three Fiber** for 3D rendering and scenes
- **Vite** as the build tool and development server
- **Tailwind CSS** with shadcn/ui components for styling
- **Zustand** for state management (game state and audio)
- **TanStack Query** for server state management
- Component-based architecture with separation of UI components and game logic

### Backend Architecture
- **Express.js** server with TypeScript
- RESTful API structure (though minimal routes currently implemented)
- In-memory storage with interface for easy database migration
- Static file serving for both the React SPA and standalone game
- Development hot reloading with Vite integration

### Data Storage
- **Drizzle ORM** configured for PostgreSQL
- Database schema defined in shared directory for type safety
- Currently using in-memory storage with `MemStorage` class
- Easy migration path to PostgreSQL when `DATABASE_URL` is provided
- Schema includes basic user management (id, username, password)

## Key Components

### Game System
- **Game State Management**: Zustand store for game phases (ready, playing, ended)
- **Audio System**: Centralized audio management with mute/unmute functionality
- **3D Rendering**: React Three Fiber canvas with shader support (GLSL)
- **UI Interface**: Game controls, restart functionality, and status display

### Authentication & Users
- User schema with username/password structure
- Storage interface designed for CRUD operations
- Prepared for session management (connect-pg-simple dependency present)

### Shared Code
- TypeScript interfaces and schemas shared between client and server
- Zod validation schemas for type-safe data transfer
- Database schema definitions accessible to both backend and frontend

## Data Flow

1. **Client Initialization**: React app loads with 3D canvas and UI components
2. **Game State**: Zustand manages game phases and user interactions
3. **Audio Management**: Centralized sound system with mute controls
4. **Server Communication**: TanStack Query handles API requests
5. **Data Persistence**: Drizzle ORM ready for PostgreSQL integration

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **React Three Fiber ecosystem**: 3D rendering (@react-three/fiber, @react-three/drei, @react-three/postprocessing)
- **Radix UI**: Accessible component primitives
- **Drizzle Kit**: Database migrations and schema management

### Development Tools
- **TypeScript**: Type safety across the entire stack
- **ESBuild**: Production bundling for server code
- **Vite**: Frontend development and building
- **GLSL**: Shader support for advanced 3D effects

## Deployment Strategy

### Development
- Vite dev server with HMR for frontend development
- Express server with TypeScript compilation via `tsx`
- Hot reloading and error overlay for development experience

### Production
- **Build Process**: 
  - Frontend: Vite builds React app to `dist/public`
  - Backend: ESBuild bundles server code to `dist/index.js`
- **Asset Handling**: Support for large 3D models, audio files, and shaders
- **Static Serving**: Express serves both API routes and static frontend
- **Database**: Configured for PostgreSQL with environment-based connection

### Architecture Decisions

**Monorepo Structure**: Shared code between client and server ensures type safety and reduces duplication. The `shared/` directory contains database schemas and common interfaces.

**3D-First Design**: The application is built around React Three Fiber, suggesting it's designed for immersive 3D experiences rather than traditional web interfaces.

**Flexible Storage**: The storage interface abstraction allows easy migration from in-memory development storage to PostgreSQL production database.

**Component Architecture**: Extensive use of Radix UI and shadcn/ui provides accessible, customizable components while maintaining design consistency.

**State Management Strategy**: Zustand for client-side game state and TanStack Query for server state creates a clear separation of concerns.

The application is architected to support complex 3D games or interactive experiences while maintaining the flexibility to scale with additional features and users.