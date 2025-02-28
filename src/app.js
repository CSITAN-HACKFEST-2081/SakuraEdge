"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// import userRouter from './routers/userRouter';
// import chatRouter from './routers/chatRouter';
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/', (req, res) => {
    console.log(req.method);
    res.send('This is the backend server of Aarogya, Whatsup visitor!!');
});
// app.use('/api/users', userRouter);
// app.use('/api/chats', chatRouter);  
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
});
