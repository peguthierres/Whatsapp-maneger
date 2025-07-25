# WhatsApp Business Chatbot Manager - Replit.md

## Overview

This is a full-stack Micro-SaaS application for managing WhatsApp Business chatbots. It provides a comprehensive platform for creating, managing, and monitoring automated conversation flows through a visual drag-and-drop interface. The system integrates with WhatsApp Business API to enable automated customer interactions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend, backend, and data layers:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: TailwindCSS with shadcn/ui component library
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with proper error handling and logging middleware
- **Authentication**: Replit Auth with OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL storage

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Migrations**: Drizzle Kit for schema management

## Key Components

### 1. Authentication System
- **Solution**: Replit Auth integration with OpenID Connect
- **Rationale**: Leverages Replit's built-in authentication for seamless user management
- **Session Storage**: PostgreSQL-backed sessions for persistence

### 2. Flow Management Engine
- **Visual Builder**: Drag-and-drop interface for creating conversation flows
- **Node Types**: Message, Condition, Webhook, and Delay nodes
- **Graph Structure**: Nodes and links system creating directed conversation graphs
- **Execution Engine**: Dynamic flow processing based on user inputs and triggers

### 3. WhatsApp Integration
- **API**: WhatsApp Business API for message sending and receiving
- **Webhooks**: Configurable endpoints for real-time message processing
- **Message Handling**: Automatic flow execution based on incoming messages

### 4. Monitoring and Logging
- **Message Logs**: Complete audit trail of all conversations
- **Webhook Logs**: External API call tracking and debugging
- **Real-time Updates**: Live monitoring of bot interactions

## Data Flow

1. **User Authentication**: Users authenticate via Replit Auth
2. **Flow Creation**: Users create conversation flows using the visual builder
3. **WhatsApp Setup**: Users configure WhatsApp Business API credentials
4. **Message Reception**: Incoming WhatsApp messages trigger webhook processing
5. **Flow Execution**: The flow engine processes messages and executes appropriate flows
6. **Response Generation**: Bot sends automated responses based on flow logic
7. **Logging**: All interactions are logged for monitoring and analysis

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **@radix-ui/**: Comprehensive UI component primitives
- **@tanstack/react-query**: Server state management
- **express**: Web application framework
- **passport**: Authentication middleware

### Development Dependencies
- **TypeScript**: Type safety across the stack
- **Vite**: Fast development and build tooling
- **TailwindCSS**: Utility-first CSS framework
- **ESLint/Prettier**: Code quality and formatting

### External Services
- **WhatsApp Business API**: Message sending and receiving
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit Auth**: User authentication and authorization

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite development server with HMR
- **Database**: Neon serverless PostgreSQL
- **Environment Variables**: Managed through Replit secrets

### Production Build
- **Frontend**: Static assets built with Vite
- **Backend**: Node.js application bundled with esbuild
- **Database Migrations**: Automated via Drizzle Kit
- **Process Management**: Single Node.js process serving both API and static files

### Key Architectural Decisions

1. **Monorepo Structure**: Single repository with shared types and schemas for better maintainability
2. **Type Safety**: End-to-end TypeScript for reduced runtime errors
3. **Schema Validation**: Zod schemas for runtime type checking and API validation
4. **Component Architecture**: Modular React components with clear separation of concerns
5. **Database Design**: Normalized schema with proper foreign key relationships
6. **Session Storage**: Database-backed sessions for scalability and persistence

### Pros and Cons of Chosen Approach

**Pros:**
- Full type safety across the stack
- Modern development experience with hot reload
- Scalable architecture with proper separation of concerns
- Built-in authentication reduces complexity
- Comprehensive UI component library for rapid development

**Cons:**
- Complex setup for beginners
- Multiple moving parts requiring coordination
- Dependency on external services (Neon, WhatsApp API)
- Potential performance considerations with real-time processing