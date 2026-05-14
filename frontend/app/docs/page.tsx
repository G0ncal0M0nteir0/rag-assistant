import Link from "next/link";

export default function DocsPage() {
  return (
    <main className="min-h-screen py-16 px-6 bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">KnowLix Documentation</h1>
          <p className="mt-2 text-lg text-slate-700 dark:text-slate-300">
            Complete guide to understanding, installing, and using the RAG Assistant
          </p>
        </div>

        {/* Project Overview */}
        <section className="mb-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">What is KnowLix?</h2>
          <p className="text-slate-800 dark:text-slate-200 mb-3">
            KnowLix is a Retrieval-Augmented Generation (RAG) assistant that allows users to upload documents and chat with them using AI-powered semantic search. It's designed for privacy-first use cases where you want to keep sensitive data local while benefiting from intelligent document querying and analysis.
          </p>
          <p className="text-slate-800 dark:text-slate-200">
            The system combines document management, semantic embeddings, and an LLM interface to enable users to ask questions about their uploaded content and receive accurate, context-aware responses.
          </p>
        </section>

        {/* Key Features */}
        <section className="mb-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Key Features</h2>
          <ul className="space-y-2 text-slate-800 dark:text-slate-200">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <span><strong>Document Upload & Management</strong> — Users can upload text, PDF, Word, and PowerPoint documents</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <span><strong>Semantic Search</strong> — AI-powered embeddings enable intelligent document retrieval</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <span><strong>Chat Interface</strong> — Ask questions and receive AI-generated responses based on your documents</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <span><strong>User Authentication</strong> — Secure login and multi-user support</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <span><strong>Private & Local</strong> — Keep your data secure with local vector storage</span>
            </li>
          </ul>
        </section>

        {/* Architecture */}
        <section className="mb-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Architecture Overview</h2>
          <div className="space-y-4 text-slate-800 dark:text-slate-200">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Backend API</h3>
              <p>FastAPI application with RESTful endpoints for authentication, document management, and chat operations. Handles vector embeddings, database operations, and LLM integration.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Frontend UI</h3>
              <p>Next.js web application providing a modern, responsive interface for document uploads, account management, and interactive chat with documents.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Data Layer</h3>
              <p>Combination of SQLite/PostgreSQL for relational data and Chroma vector database for semantic embeddings and retrieval.</p>
            </div>
          </div>
        </section>

        {/* Backend Details */}
        <section className="mb-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Backend Technology Stack</h2>
          <div className="space-y-3 text-slate-800 dark:text-slate-200">
            <p><strong className="text-slate-900 dark:text-white">Framework:</strong> FastAPI — Modern, fast Python web framework</p>
            <p><strong className="text-slate-900 dark:text-white">ORM:</strong> SQLAlchemy — For database models and queries</p>
            <p><strong className="text-slate-900 dark:text-white">Authentication:</strong> JWT tokens with bcrypt password hashing</p>
            <p><strong className="text-slate-900 dark:text-white">Embeddings:</strong> sentence-transformers for local embedding generation</p>
            <p><strong className="text-slate-900 dark:text-white">LLM Integration:</strong> Groq API for fast inference</p>
            <p><strong className="text-slate-900 dark:text-white">Rate Limiting:</strong> slowapi for request throttling</p>
          </div>
        </section>

        {/* Frontend Details */}
        <section className="mb-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Frontend Technology Stack</h2>
          <div className="space-y-3 text-slate-800 dark:text-slate-200">
            <p><strong className="text-slate-900 dark:text-white">Framework:</strong> Next.js 16 — React framework with app router</p>
            <p><strong className="text-slate-900 dark:text-white">Styling:</strong> Tailwind CSS for responsive design</p>
            <p><strong className="text-slate-900 dark:text-white">Animation:</strong> Framer Motion for smooth interactions</p>
            <p><strong className="text-slate-900 dark:text-white">Icons:</strong> Lucide React for UI components</p>
            <p><strong className="text-slate-900 dark:text-white">UI Components:</strong> Shadcn/ui and Radix UI primitives</p>
          </div>
        </section>

        {/* Databases & Authentication */}
        <section className="mb-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Databases & Authentication</h2>
          <div className="space-y-4 text-slate-800 dark:text-slate-200">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Relational Database (SQLite/PostgreSQL)</h3>
              <p>Stores user accounts, document metadata, chat history, and application state. Migrations are managed with Alembic for version control.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Vector Database (Chroma)</h3>
              <p>Stores document embeddings for semantic search and retrieval. Enables fast, accurate matching of user queries to relevant document chunks.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Authentication</h3>
              <p>JWT-based token authentication with secure password hashing. Users register, log in, and receive auth tokens for subsequent API requests. Session management is handled server-side.</p>
            </div>
          </div>
        </section>

        {/* Installation */}
        <section className="mb-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Installation Instructions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Prerequisites</h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-800 dark:text-slate-200">
                <li>Python 3.10+</li>
                <li>Node.js 18+</li>
                <li>Git</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Backend Setup</h3>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-md overflow-x-auto text-sm mb-3">
{`cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt`}
              </pre>
              <p className="text-slate-800 dark:text-slate-200 mb-2">Create a <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">.env</code> file:</p>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-md overflow-x-auto text-sm">
{`DATABASE_URL=sqlite:///./test_db.sqlite3
SECRET_KEY=your-secret-key-here
GROQ_API_KEY=your-groq-api-key`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Frontend Setup</h3>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-md overflow-x-auto text-sm">
{`cd frontend
npm install
npm run dev`}
              </pre>
            </div>
          </div>
        </section>

        {/* API References */}
        <section className="mb-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">API References</h2>
          <p className="text-slate-700 dark:text-slate-300 mb-4">All endpoints require authentication with a valid JWT token in the Authorization header.</p>
          
          <div className="space-y-6 text-slate-800 dark:text-slate-200">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Authentication Endpoints</h3>
              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-sm space-y-2">
                <div><code className="text-blue-600 dark:text-blue-400">POST /auth/register</code> — Create new user account</div>
                <div><code className="text-blue-600 dark:text-blue-400">POST /auth/login</code> — Log in and receive JWT token</div>
                <div><code className="text-blue-600 dark:text-blue-400">GET /auth/verify</code> — Verify email with token</div>
                <div><code className="text-blue-600 dark:text-blue-400">POST /auth/resend-verification</code> — Resend verification email</div>
                <div><code className="text-blue-600 dark:text-blue-400">POST /auth/forgot-password</code> — Request password reset</div>
                <div><code className="text-blue-600 dark:text-blue-400">POST /auth/reset-password</code> — Reset password with token</div>
                <div><code className="text-blue-600 dark:text-blue-400">GET /auth/me</code> — Get current user profile</div>
                <div><code className="text-blue-600 dark:text-blue-400">PATCH /auth/me</code> — Update user profile and settings</div>
                <div><code className="text-blue-600 dark:text-blue-400">DELETE /auth/me</code> — Delete user account and all data</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Admin Endpoints</h3>
              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-sm space-y-2">
                <div><code className="text-blue-600 dark:text-blue-400">GET /auth/admin/stats</code> — Get admin statistics (total users, documents, tokens)</div>
                <div><code className="text-blue-600 dark:text-blue-400">GET /auth/admin/users</code> — List all users with stats</div>
                <div><code className="text-blue-600 dark:text-blue-400">GET /auth/admin/users/&#123;user_id&#125;</code> — Get specific user details</div>
                <div><code className="text-blue-600 dark:text-blue-400">DELETE /auth/admin/users/&#123;user_id&#125;</code> — Delete user account</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Document Endpoints</h3>
              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-sm space-y-2">
                <div><code className="text-blue-600 dark:text-blue-400">POST /documents/upload</code> — Upload a document (multipart/form-data: PDF, TXT, DOCX, PPTX)</div>
                <div><code className="text-blue-600 dark:text-blue-400">GET /documents/</code> — Get user's documents</div>
                <div><code className="text-blue-600 dark:text-blue-400">DELETE /documents/&#123;document_id&#125;</code> — Delete a document</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Chat Endpoints</h3>
              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-sm space-y-2">
                <div><code className="text-blue-600 dark:text-blue-400">POST /chat/ask</code> — Send a query and receive AI response (20 requests/minute limit)</div>
                <div><code className="text-blue-600 dark:text-blue-400">GET /chat/usage</code> — Get token usage statistics</div>
                <div><code className="text-blue-600 dark:text-blue-400">GET /chat/quota</code> — Get user quota information</div>
                <div><code className="text-blue-600 dark:text-blue-400">GET /chat/history</code> — Get all chat messages</div>
                <div><code className="text-blue-600 dark:text-blue-400">DELETE /chat/history</code> — Clear all chat history</div>
              </div>
            </div>
          </div>
        </section>

        {/* User Guide */}
        <section className="mb-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">User Guide</h2>
          
          <div className="space-y-4 text-slate-800 dark:text-slate-200">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">1. Getting Started</h3>
              <p>Visit the landing page and click "Get Started" to register a new account. Provide your email and password to create your account.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">2. Upload Documents</h3>
              <p>After logging in, navigate to the documents section and upload files (TXT, PDF, DOCX, PPTX). The system will process and create embeddings automatically.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">3. Chat with Documents</h3>
              <p>Go to the chat interface, select documents if needed, and ask questions about your content. The AI will search through embeddings and provide relevant answers.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">4. Manage Documents</h3>
              <p>View, organize, and delete documents from your library. Each document's metadata is displayed for easy reference.</p>
            </div>
          </div>
        </section>

        <div className="mt-12 flex gap-4 justify-center">
          <Link href="/" className="rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-2 font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
