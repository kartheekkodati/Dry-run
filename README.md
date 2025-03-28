# Code Editor Application

A full-stack web application featuring a code editor with real-time execution capabilities.

## Features

- Monaco-based code editor with syntax highlighting
- Real-time code execution
- Support for multiple programming languages
- Code storage and retrieval
- Real-time terminal interaction via Socket.io
- Responsive design for various screen sizes

## Tech Stack

### Frontend
- React 18
- Monaco Editor
- Axios for API requests

### Backend
- Node.js with Express
- Socket.io for real-time communication
- MongoDB with Mongoose (optional, falls back to in-memory storage)

## Installation

1. **Clone the repository**
   ```
   git clone <repository-url>
   cd Dry-run-master
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```
   PORT=8080
   MONGODB_URI=your_mongodb_connection_string (optional)
   ```

## Running the Application

1. **Start the backend server**
   ```
   npm run server
   ```

2. **Start the frontend development server**
   ```
   npm start
   ```

3. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## Project Structure

- `/src` - React frontend code
- `/backend` - Express server and API routes
  - `/routes` - API route definitions
  - `/config` - Configuration files including database connection
- `/public` - Static assets
- `/build` - Production build output

## API Endpoints

- `GET /api/code` - Get all saved code snippets
- `GET /api/code/:id` - Get a specific code snippet
- `POST /api/code` - Save a new code snippet
- `POST /api/execute` - Execute code and return results

## Socket.IO Events

- `terminal-input` - Send input to the terminal
- `terminal-output` - Receive output from the terminal

## Dependencies

- react: ^18.2.0
- react-dom: ^18.2.0
- react-scripts: ^5.0.1
- @monaco-editor/react: ^4.7.0
- monaco-editor: ^0.52.2
- express: ^4.21.2
- socket.io: ^4.8.1
- mongoose: ^8.12.1
- axios: ^1.8.1
- cors: ^2.8.5
- dotenv: ^16.4.7
- uuid: ^11.1.0

## License

ISC
