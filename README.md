# NoteFlow AI | Premium AI Workspace

NoteFlow AI is a high-performance, full-stack notes workspace designed for professionals and students. It features real-time AI-powered insights, a sophisticated rich-text editor, and a scalable cloud database. Built with a "Glassmorphism" design aesthetic, it provides a premium user experience for organizing thoughts and automating productivity.

## 🚀 Key Features

-   **Intelligent Analysis**: Leverages Llama 3.3 (via Groq) to summarize notes, extract action plans, and suggest optimized titles.
-   **Rich Text Mastery**: Integrated TipTap editor with support for professional formatting (Bold, Italic, Code, Underline, etc.).
-   **Cloud-Native Persistence**: Scalable MongoDB Atlas architecture ensuring data is safe and accessible from anywhere.
-   **Secure Authentication**: Robust JWT-based security with password hashing and session management.
-   **Dynamic Dashboard**: Visual insights and activity tracking to monitor your productivity flow.
-   **Public Sharing**: Instantly generate secure public links to share your thoughts with the world.

## 🛠️ Architecture & Tech Stack

This project follows a modern **MERN-adjacent** architecture, optimized for speed and scalability.

-   **Frontend**: React 18+ powered by **Vite** for lightning-fast development and optimized production builds.
-   **Styling**: Vanilla CSS3 with custom design tokens, leveraging modern Flexbox/Grid and **Framer Motion** for micro-animations.
-   **Backend**: Node.js & Express.js REST API.
-   **Database**: **MongoDB Atlas** (Cloud) with **Mongoose** ODM for flexible and scalable data modeling.
-   **AI Engine**: **Groq API** (Llama 3.3 70B) for high-speed, enterprise-grade inference.
-   **Icons**: Lucide React for a clean, consistent visual language.

## 📦 Installation & Setup

### 1. Prerequisites
-   Node.js (v18 or higher)
-   npm or yarn
-   A MongoDB Atlas account (Free tier works perfectly)
-   A Groq API Key (Get it free at [console.groq.com](https://console.groq.com))

### 2. Clone and Install
```bash
git clone <your-repo-url>
cd AI-Notes
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory and copy the contents from `.env.example`. Fill in your specific credentials:
- `MONGODB_URI`: Your Atlas connection string.
- `GROQ_API_KEY`: Your Groq key.
- `JWT_SECRET`: A secure string for token signing.

### 4. Running the Application
NoteFlow uses `concurrently` to run both the frontend and backend with a single command:

```bash
npm run dev
```
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

## 🧪 Testing the Application

1.  **Register**: Create a new account on the Signup page.
2.  **Create Note**: Click "New Work" to open the editor.
3.  **AI Insights**: Write some text (e.g., meeting minutes) and use the "Summarize" or "Extract Action Plan" buttons in the AI Engine sidebar.
4.  **Formatting**: Use the toolbar to style your text; changes are auto-saved.
5.  **Settings**: Toggle between Dark and Light mode to see the adaptive design system.

## 📂 Project Structure

-   `/src`: React frontend source code.
    -   `/components`: Reusable UI elements (Editor, Layout).
    -   `/pages`: Main application views (Notes, Dashboard, Settings).
-   `/server`: Node.js/Express backend.
    -   `/models`: Mongoose schemas (User, Note, Activity).
    -   `index.js`: Main API entry point and routes.
-   `public/`: Static assets and logos.

## 📄 License

This project is open-source and intended for professional portfolio evaluation.
