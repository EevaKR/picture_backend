import express, { Request, Response } from 'express';
import authRouter from "./routes/authRouter";
import imageRouter from "./routes/imageRouter";
import dotenv from "dotenv";
import bodyParser from 'body-parser';
import cors from "cors";
import path from 'path';
import fs from 'fs';
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorMiddleware";
import connectUserDB from "./connections/userDB";
import userRouter from "./routes/userRouter"
import { authenticate } from './middleware/authMiddleware';
import helmet from "helmet";



dotenv.config();

interface UserBasicInfo {
  _id: string;
  name: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserBasicInfo | null;
    }
  }
}


const app = express();
const port = 3001;

app.use(helmet());

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(cookieParser());


// Middleware
app.use(bodyParser.json()); // To recognize the req obj as a json obj
app.use(bodyParser.urlencoded({ extended: true }));


app.use(authRouter);
app.use("/images", imageRouter);
app.use("/users", authenticate, userRouter);

// Health check endpoint for Docker
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Picture Store API'
  });
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
=======
const users = [
  { username: 'testuser', password: 'password123' },
  { username: 'johndoe', password: 'johnspassword' }
];


app.use(errorHandler);
// Route to catch JSON-data



/* app.get('/api/user', (req: Request, res: Response) => {
  fs.readFile('testuser.json', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading data');
      return;
    }
    res.json(JSON.parse(data));
  });
});

app.post('/api/data', (req: Request, res: Response) => {
  const newData = req.body;
  res.json({
    message: "Data received!",
    data: newData
  });
});

*/

// Serve static files from React build-folder
app.use(express.static(path.join(__dirname, 'frontend/mydocker_ts/build')));

// All routes go to index.html
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'frontend/mydocker_ts/build', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


connectUserDB();
=======

interface UserBasicInfo {
  _id: string;
  name: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserBasicInfo | null;
    }
  }
}
