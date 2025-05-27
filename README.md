# Picture Store API

A complete picture storage solution with user authentication, multi-file upload, metadata management, and search capabilities.

## 🚀 Features

- **Multi-file Upload**: Upload multiple images with structured metadata
- **Automatic Thumbnails**: 200x200px thumbnails generated automatically
- **JWT Authentication**: Secure user authentication with HTTP-only cookies
- **Structured Metadata**: Support for AREA, ROLE, TARGET options with order
- **Search & Filter**: Search by description, filename, and option types/values
- **File Security**: Image validation, size limits, automatic cleanup
- **Local Database Fallback**: File-based storage when MongoDB isn't available

## 📋 API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout

### Image Management
- `POST /images/upload` - Upload multiple images with metadata
- `GET /images` - Get user's images (paginated)
- `GET /images/:id` - Get single image
- `PUT /images/:id` - Update image metadata
- `DELETE /images/:id` - Delete image
- `GET /images/public` - Get public images
- `GET /images/search` - Search images
- `GET /images/options/:type/:value` - Filter by option type/value

### File Serving
- `GET /uploads/*` - Serve uploaded images
- `GET /uploads/thumbnails/*` - Serve thumbnails

## 🛠️ Setup

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd omadocker
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the example environment file and configure it:
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your_secure_64_character_jwt_secret_here
MONGODB_URI=mongodb://localhost:27017/picturestore
```

**Important**: 
- Generate a secure JWT secret (64 characters recommended)
- For production, use MongoDB Atlas connection string
- Never commit `.env` file to version control

### 4. Start the server

#### Option A: Local Development
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm run build
npm start
```

#### Option B: Docker Container
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build and run manually
docker build -t picture-store-api .
docker run -p 3001:3001 --env-file .env picture-store-api
```

The server will start at `http://localhost:3001`

## 📸 Image Upload Format

The main feature uses multipart/form-data with this structure:

```javascript
// Form data
const formData = new FormData();

// Add files
files.forEach(file => {
  formData.append('files', file);
});

// Add metadata
const metadata = [
  {
    "FileName": "image1.jpg",
    "Description": "Description of the image",
    "Options": [
      {"type": "AREA", "value": "DEMO ALUE", "order": 0},
      {"type": "ROLE", "value": "Valvonta", "order": 1},
      {"type": "TARGET", "value": "Valvonta", "order": 2}
    ]
  }
];
formData.append('metadata', JSON.stringify(metadata));

// Upload
fetch('/images/upload', {
  method: 'POST',
  body: formData,
  credentials: 'include'
});
```

## 🗄️ Database

The application supports both MongoDB and local file-based storage:

- **MongoDB**: Configure `MONGODB_URI` in `.env`
- **Local Storage**: Automatic fallback to `data/` directory when MongoDB is unavailable

## 🔒 Security Features

- JWT authentication with HTTP-only cookies
- File type validation (images only)
- File size limits (10MB per file, 10 files max)
- User-based access control
- Input validation and sanitization
- Automatic file cleanup on errors

## 📁 Project Structure

```
omadocker/
├── src/                    # Backend source code
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Authentication, upload, error handling
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── connections/       # Database connections
│   └── utils/             # Utility functions
├── docs/                  # Documentation
│   ├── API_DOCUMENTATION.md
│   ├── SECURITY_SETUP.md
│   └── REPOSITORY_STATUS.md
├── tests/                 # Test files
├── data/                  # Local database storage
├── uploads/               # Uploaded images
├── frontend/              # Frontend projects (separate)
├── package.json           # Dependencies
├── .env.example           # Environment template
└── README.md              # This file
```

## 🧪 Testing

Use the provided API documentation and examples in `docs/API_DOCUMENTATION.md` for testing endpoints.

## 📝 License

This project is for educational/personal use.

## ⚠️ Important Notes

- Always use HTTPS in production
- Regularly update dependencies
- Monitor file storage usage
- Backup your database regularly
- Never expose sensitive environment variables
