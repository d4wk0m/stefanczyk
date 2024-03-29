"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const fs = __importStar(require("fs"));
const server = http_1.default.createServer((req, res) => {
    if (useStatic("static/dist", req, res)) {
        return;
    }
    res.end("Hello world");
});
const io = new socket_io_1.Server(server, {
    path: "/socket",
});
io.on("connection", (socket) => {
    const date = new Date();
    const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    const username = socket.handshake.query.username;
    socket.broadcast.emit("message", {
        content: `User ${username} has joined the chat`,
        date: time,
        type: "connect",
        from: "server",
    });
    socket.on("message", (message) => {
        const date = new Date();
        const hour = date.getHours() + 1 < 10
            ? `0${date.getHours() + 1}`
            : (date.getHours() + 1).toString();
        const minute = date.getMinutes() < 10
            ? `0${date.getMinutes()}`
            : date.getMinutes().toString();
        const seccond = date.getSeconds() < 10
            ? `0${date.getSeconds()}`
            : date.getSeconds().toString();
        const time = `${hour}:${minute}:${seccond}`;
        socket.broadcast.emit("message", {
            content: message.message,
            from: message.username,
            date: time,
            type: "incoming",
        });
        socket.emit("message", {
            content: message.message,
            from: message.username,
            date: time,
            type: "outgoing",
        });
    });
    socket.on("disconnect", () => {
        const date = new Date();
        const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
        socket.broadcast.emit("message", {
            content: `User ${username} has left the chat`,
            date: time,
            type: "disconnect",
            from: "server",
        });
    });
});
function useStatic(path, req, res) {
    let url = decodeURI(req.url || "/");
    if (url === null || url === void 0 ? void 0 : url.endsWith("/")) {
        url += "index.html";
    }
    const finalPath = `./${path}${url}`;
    if (!finalPath.includes(".")) {
        return false;
    }
    fs.readFile(finalPath, (err, data) => {
        if (err) {
            res.statusCode = 404;
            res.end("404 - File not found");
        }
        else {
            res.writeHead(200, {
                "Content-Type": handleFileType(finalPath),
            });
            res.write(data);
            res.end();
        }
    });
    return true;
}
function handleFileType(fileName) {
    const ext = fileName.split(".").pop();
    switch (ext) {
        case "html":
            return "text/html";
        case "css":
            return "text/css";
        case "js":
            return "text/javascript";
        case "png":
            return "image/png";
        case "jpg":
            return "image/jpg";
        case "jpeg":
            return "image/jpeg";
        case "svg":
            return "image/svg+xml";
        default:
            return "text/plain";
    }
}
server.listen(3000);
