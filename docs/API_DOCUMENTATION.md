# Picture Store API Documentation

## Overview
This API provides a complete picture storage solution with user authentication, file upload, metadata management, and search capabilities.

## Base URL
```
http://localhost:3001
```

## Authentication
The API uses JWT tokens stored in HTTP-only cookies. You need to register/login first to access protected endpoints.

## API Endpoints

### Authentication Endpoints

#### Register User
```http
POST /register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User
```http
POST /login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Logout User
```http
POST /logout
```

### Image Endpoints

#### Upload Multiple Images
```http
POST /images/upload
Content-Type: multipart/form-data
Authorization: Required (JWT Cookie)

Form Data:
- files: [array of image files]
- metadata: JSON string containing metadata array

Example metadata:
[
  {
    "FileName": "filename.jpg",
    "Description": "Description of the image",
    "Options": [
      {
        "type": "AREA",
        "value": "DEMO ALUE",
        "order": 0
      },
      {
        "type": "ROLE",
        "value": "Valvonta",
        "order": 1
      },
      {
        "type": "TARGET",
        "value": "Valvonta",
        "order": 2
      }
    ]
  }
]
```

**Response:**
```json
{
  "message": "2 images uploaded successfully",
  "images": [
    {
      "id": "64f5a1b2c3d4e5f6a7b8c9d0",
      "filename": "files-1640995200000-123456789.jpg",
      "originalName": "filename.jpg",
      "size": 1024000,
      "url": "/uploads/files-1640995200000-123456789.jpg",
      "thumbnailUrl": "/uploads/thumbnails/thumb_files-1640995200000-123456789.jpg",
      "description": "Description of the image",
      "options": [
        {
          "type": "AREA",
          "value": "DEMO ALUE",
          "order": 0
        }
      ],
      "uploadDate": "2023-12-31T12:00:00.000Z"
    }
  ]
}
```

#### Get User's Images
```http
GET /images?page=1&limit=10
Authorization: Required (JWT Cookie)
```

**Response:**
```json
{
  "images": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### Get Single Image
```http
GET /images/:id
Authorization: Optional (required for private images)
```

#### Update Image Metadata
```http
PUT /images/:id
Content-Type: application/json
Authorization: Required (JWT Cookie)

{
  "description": "Updated description",
  "options": [
    {
      "type": "AREA",
      "value": "Updated Area",
      "order": 0
    }
  ],
  "isPublic": true
}
```

#### Delete Image
```http
DELETE /images/:id
Authorization: Required (JWT Cookie)
```

#### Get Public Images
```http
GET /images/public?page=1&limit=10
```

#### Search Images
```http
GET /images/search?query=searchterm&optionType=AREA&optionValue=DEMO&page=1&limit=10
Authorization: Required (JWT Cookie)
```

**Query Parameters:**
- `query`: Search in description and filename
- `optionType`: Filter by option type (AREA, ROLE, TARGET, etc.)
- `optionValue`: Filter by option value
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

#### Get Images by Option
```http
GET /images/options/:type/:value?page=1&limit=10
Authorization: Required (JWT Cookie)
```

**Examples:**
- `GET /images/options/AREA` - Get all images with AREA type options
- `GET /images/options/AREA/DEMO%20ALUE` - Get images with specific AREA value

### User Endpoints

#### Get User Profile
```http
GET /users/:id
Authorization: Required (JWT Cookie)
```

## File Access

### View Images
```http
GET /uploads/filename.jpg
```

### View Thumbnails
```http
GET /uploads/thumbnails/thumb_filename.jpg
```

## Data Models

### Image Model
```typescript
{
  _id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadDate: Date;
  userId: string;
  description: string;
  options: [
    {
      type: string;
      value: string;
      order: number;
    }
  ];
  isPublic: boolean;
  url: string;
  thumbnailUrl: string;
}
```

### User Model
```typescript
{
  _id: string;
  name: string;
  email: string;
  password: string; // hashed
}
```

## Error Responses

### 400 Bad Request
```json
{
  "message": "No files uploaded"
}
```

### 401 Unauthorized
```json
{
  "message": "User not authenticated"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "message": "Image not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Error processing images"
}
```

## Usage Examples

### JavaScript/Fetch Example
```javascript
// Upload images with metadata
const formData = new FormData();

// Add files
files.forEach(file => {
  formData.append('files', file);
});

// Add metadata
const metadata = [
  {
    "FileName": "image1.jpg",
    "Description": "First image",
    "Options": [
      { "type": "AREA", "value": "DEMO ALUE", "order": 0 },
      { "type": "ROLE", "value": "Valvonta", "order": 1 }
    ]
  }
];
formData.append('metadata', JSON.stringify(metadata));

// Upload
fetch('/images/upload', {
  method: 'POST',
  body: formData,
  credentials: 'include' // Important for cookies
})
.then(response => response.json())
.then(data => console.log(data));
```

### cURL Example
```bash
# Login first
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  -c cookies.txt

# Upload images
curl -X POST http://localhost:3001/images/upload \
  -b cookies.txt \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg" \
  -F 'metadata=[{"FileName":"image1.jpg","Description":"Test image","Options":[{"type":"AREA","value":"DEMO","order":0}]}]'
```

## Features

✅ **Multi-file upload** with metadata  
✅ **Automatic thumbnail generation**  
✅ **User authentication** with JWT  
✅ **File type validation** (images only)  
✅ **Structured metadata** with Options array  
✅ **Search functionality** by description, filename, and options  
✅ **Pagination** for all list endpoints  
✅ **Public/private** image sharing  
✅ **File size limits** (10MB per file, 10 files max)  
✅ **Automatic cleanup** on errors  
✅ **Static file serving** for uploaded images  

## Security Features

- JWT authentication with HTTP-only cookies
- File type validation (images only)
- File size limits
- User-based access control
- Input validation and sanitization
- Error handling with cleanup
