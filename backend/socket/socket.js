
import { Server } from "socket.io";
import http from "http";
import express from "express";
import ACTIONS from "../../frontend/src/components/editor/Actions.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Allow requests from your frontend (without the trailing slash)
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true, // Set to true if you're using cookies
  },
});

// Map to store userId and corresponding socketId
const userSocketMap = {}; // {userId: socketId}

const userRoomMap = {}; // {userId: roomId}
function getAllClientsInRoom(roomId) {
  // Map
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
      (socketId) => {
          return {
              socketId,
              username: userRoomMap[socketId],
          };
      }
  );
}

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

// Handle socket connections
io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  // Get userId from the connection handshake
  const userId = socket.handshake.query.userId;

  if (userId && userId !== "undefined") {
    // Add userId to the userSocketMap
    userSocketMap[userId] = socket.id;
  }

  // Emit the list of online users whenever a new user connects
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userRoomMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllClientsInRoom(roomId);
    clients.forEach(({ socketId }) => {
        io.to(socketId).emit(ACTIONS.JOINED, {
            clients,
            username,
            socketId: socket.id,
        });
    });
  });
  

  socket.on('edit', (content) => {
    
      io.emit('updateContent', content);
  });
  // Listen for the disconnect event to remove the user from the map
  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);

    // Remove the user from the map when they disconnect
    if (userId && userSocketMap[userId]) {
      delete userSocketMap[userId];
    }
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
        socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
            socketId: socket.id,
            username: userSocketMap[socket.id],
        });
    });
    delete userSocketMap[socket.id];
    delete userRoomMap[socket.id];
    socket.leave();
    // Emit updated list of online users
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Export the app, io, and server for use elsewhere
export { app, io, server };
