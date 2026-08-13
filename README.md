# BigHammer RAG Frontend

This is the user interface for the BigHammer RAG Application, allowing users to securely upload documents and interact with an AI that retrieves and cites information from their private data.

## 🏗️ Architecture

- **Framework:** React 18
- **Bundler:** Vite (for lightning-fast HMR and native ES Modules)
- **Styling:** Tailwind CSS (for rapid, responsive UI development)
- **State Management & Routing:** React Router DOM
- **HTTP Client:** Axios (configured with JWT Interceptors for security)

## 🚀 Key Features

1. **Secure Authentication:** Implements JWT-based authentication to ensure users can only access and query their own private documents.
2. **Real-time Document Uploads:** Seamless UI for uploading PDFs, TXTs, and DOCX files.
3. **Interactive AI Chat:** A clean chat interface that communicates with the FastAPI backend, displaying both the AI's generated answer and the source chunks it retrieved from the database.
4. **Vite Optimization:** Bypasses legacy Webpack bottlenecks for instant local server startups.

## 🛠️ Setup & Installation

### Option 1: Docker Compose (Recommended)
The entire application is orchestrated using Docker Compose. From the root directory, simply run:
```bash
docker-compose up -d --build
```
The frontend will automatically be available at `http://localhost:5173`. 
*(Note: To prevent Chrome HSTS issues during local testing, access the app via `http://127.0.0.1:5173`)*

### Option 2: Local Development
1. Ensure Node.js 20+ is installed.
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. The application will start at `http://127.0.0.1:5173`.

## 📁 Project Structure

- `/src/api`: Axios client configuration and network interceptors
- `/src/components`: Reusable UI components (Modals, Buttons, Forms)
- `/src/pages`: Main application views (Dashboard, Login, Chat)
- `/src/assets`: Static images and CSS files
