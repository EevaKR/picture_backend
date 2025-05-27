"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authRouter_1 = __importDefault(require("./routes/authRouter"));
const imageRouter_1 = __importDefault(require("./routes/imageRouter"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const userDB_1 = __importDefault(require("./connections/userDB"));
const userRouter_1 = __importDefault(require("./routes/userRouter"));
const authMiddleware_1 = require("./middleware/authMiddleware");
const helmet_1 = __importDefault(require("helmet"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = 3001;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: "http://localhost:3000",
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
// Middleware
app.use(body_parser_1.default.json()); // To recognize the req obj as a json obj
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(authRouter_1.default);
app.use("/images", imageRouter_1.default);
app.use("/users", authMiddleware_1.authenticate, userRouter_1.default);
// Serve uploaded files statically
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
app.use(errorMiddleware_1.errorHandler);
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
app.use(express_1.default.static(path_1.default.join(__dirname, 'frontend/mydocker_ts/build')));
// All routes go to index.html
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'frontend/mydocker_ts/build', 'index.html'));
});
// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
(0, userDB_1.default)();
