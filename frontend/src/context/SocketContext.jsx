
import { createContext, useState, useEffect, useContext } from "react";
import { useAuthContext } from "./AuthContext";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocketContext = () => {
  return useContext(SocketContext);
};


// In your initSocket function, ensure proper connection handling
export const initSocket = (userId) => {
	return new Promise((resolve, reject) => {
	  const socket = io("https://chat-and-code.onrender.com/", {
		query: { userId: userId }, // Pass username to server
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    
	  });
  
	  socket.on("connect", () => {
		resolve(socket);
	  });
  
	  socket.on("connect_error", (err) => {
		console.error("Socket connection error:", err);
		reject(new Error("Failed to connect to WebSocket"));
	  });
  
	  socket.on("connect_timeout", () => {
		reject(new Error("Connection timed out"));
	  });
	});
};
  

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { authUser } = useAuthContext();

  useEffect(() => {
    const setupSocket = async () => {
      if (authUser) {
        // Pass username instead of userId
        const newSocket = await initSocket(authUser._id);

        setSocket(newSocket);

        // Listen to events
        newSocket.on("getOnlineUsers", (users) => {
          setOnlineUsers(users);
        });

        // Cleanup socket on unmount or authUser change
        return () => {
          newSocket.close();
          setSocket(null);
        };
      } else {
        // Ensure socket is closed when user is not authenticated
        if (socket) {
          socket.close();
          setSocket(null);
        }
      }
    };

    setupSocket();
  }, [authUser]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
