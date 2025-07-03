# AI Lab - Teachable Machine for Indonesian Students

## Overview

AI Lab is a child-friendly educational platform that teaches Indonesian students how to create AI models using machine learning. The application is built as a modern full-stack web application with React frontend and Express backend, designed to be an accessible version of Google's Teachable Machine specifically tailored for Indonesian students.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Framework**: Radix UI components with Tailwind CSS
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **AI Integration**: TensorFlow.js for client-side machine learning

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **API Design**: RESTful API with JSON responses
- **Build System**: ESBuild for server bundling

## Key Components

### Machine Learning Features
- **Image Classification**: Upload images or use webcam to train image recognition models
- **Sound Classification**: Record audio samples to train sound recognition models
- **Pose Detection**: Use webcam to train pose/gesture recognition models
- **Transfer Learning**: Uses pre-trained MobileNet model for efficient training
- **Real-time Inference**: Client-side prediction using trained models

### User Interface Components
- **Interactive Training Interface**: Step-by-step guidance for data collection, training, and testing
- **Webcam Integration**: Real-time camera access for data collection
- **Progress Tracking**: Visual feedback during model training
- **Achievement System**: Gamified learning with badges and progress tracking
- **Project Gallery**: Save and manage trained models
- **Indonesian Language Support**: All content localized for Indonesian students

### Core Features
- **Project Management**: Create, save, and load AI projects
- **Data Collection**: Multiple ways to collect training data (upload, webcam, microphone)
- **Model Training**: Simplified interface for training neural networks
- **Testing Interface**: Easy-to-use interface for testing trained models
- **Export/Import**: Save models for later use

## Data Flow

1. **Project Creation**: User selects project type (image, sound, or pose)
2. **Data Collection**: User collects training samples using various input methods
3. **Data Processing**: Client-side preprocessing of images/audio using TensorFlow.js
4. **Model Training**: Transfer learning using pre-trained models
5. **Model Evaluation**: Real-time accuracy feedback during training
6. **Testing**: User can test the trained model with new data
7. **Persistence**: Projects and models saved to local storage and PostgreSQL

## External Dependencies

### Frontend Dependencies
- **TensorFlow.js**: Client-side machine learning (`@tensorflow/tfjs`, `@tensorflow/tfjs-node`)
- **React Ecosystem**: React, React DOM, React Router (Wouter)
- **UI Libraries**: Radix UI components, Tailwind CSS, Lucide React icons
- **State Management**: TanStack Query for server state
- **Form Handling**: React Hook Form with Zod validation
- **Utilities**: date-fns, clsx, class-variance-authority

### Backend Dependencies
- **Database**: Drizzle ORM with PostgreSQL driver
- **Neon Database**: Serverless PostgreSQL (`@neondatabase/serverless`)
- **Session Storage**: connect-pg-simple for PostgreSQL sessions
- **Validation**: Zod for schema validation
- **Development**: tsx for TypeScript execution, nodemon for development

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with hot module replacement
- **Backend**: Express server with TypeScript compilation via tsx
- **Database**: Neon Database with connection pooling
- **Build Process**: Separate build commands for frontend and backend

### Production Deployment
- **Frontend Build**: Vite builds static assets to `dist/public`
- **Backend Build**: ESBuild bundles server code to `dist/index.js`
- **Database**: PostgreSQL database migrations using Drizzle Kit
- **Static Assets**: Served directly by Express in production

### Environment Configuration
- **Database**: CONNECTION_STRING via environment variables
- **Development**: NODE_ENV=development for development features
- **Production**: NODE_ENV=production for optimized builds

## Changelog

```
Changelog:
- July 03, 2025. Initial setup with complete AI Lab platform
- July 03, 2025. Added fully functional sound classifier with microphone recording
- July 03, 2025. Added fully functional pose classifier with webcam pose detection
- July 03, 2025. Implemented comprehensive help page with step-by-step tutorials
- July 03, 2025. Made all buttons consistent with unified styling across platform
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```