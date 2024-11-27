# Chappy - Real-time Chat Application

A modern chat application built with React, Node.js, and MongoDB.

## Getting Started

1. Clone the repository

```bash
git clone https://github.com/yourusername/chappy.git
cd chappy
```

2. Install dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables

```bash
# In backend directory
cp .env.example .env
```

Edit the `.env` file with your MongoDB connection string and other configurations:

```env
PORT=5001
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

4. Start the development servers

```bash
# In root directory
npm run dev
```

This will start both the frontend and backend servers concurrently.

- Frontend: http://localhost:5173
- Backend: http://localhost:5001

## Features

### Core Features

- 🔐 User Authentication
- 💬 Messaging
- 📱 Responsive Design
- 🌓 Dark/Light Mode
- 🎨 Modern UI with Tailwind CSS

### Channel Features

- 📢 Public Channels
- 🔒 Private Channels
- 🔍 Channel Search
- ✨ Channel Creation

### Direct Messaging

- 👤 User-to-User Messaging
- 🟢 Message History

### Message Features

- 😊 Emoji Support
- ```Code Syntax Highlighting```
- 📝 Message History
- ⌨️ Markdown Support

## Tech Stack

### Frontend

- React with TypeScript
- Tailwind CSS for styling
- Zustand for state management
- React Router for navigation
- Shadcn/ui for UI components

### Backend

- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT for authentication

## Contributing

Feel free to submit issues and pull requests.
