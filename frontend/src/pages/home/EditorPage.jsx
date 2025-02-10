import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import ACTIONS from "../../components/editor/Actions";
import Client from "../../components/editor/Client.jsx";
import ErrorBoundary from './ErrorBoundary.jsx';
import { initSocket } from "../../context/SocketContext";
import { useLocation, useNavigate, Navigate, useParams } from "react-router-dom";
import Landing from "../../components/editor/Landing.jsx";

  const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const [username, setUsername] = useState('');
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);
    
    useEffect(() => {
      // Access the username from the query string using URLSearchParams
      const params = new URLSearchParams(window.location.search);
      const user = params.get('username');
      if (user) {
        setUsername(user);
      }
    }, []);

    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                // console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            // Listening for joined event
            socketRef.current.on(
              ACTIONS.JOINED,
              ({ clients, username, socketId }) => {
                  if (username !== location.state?.username) {
                      toast.success(`${username} joined the room.`);
                      // console.log(`${username} joined`);
                  }
                  setClients(clients);
                  socketRef.current.emit(ACTIONS.SYNC_CODE, {
                      code: codeRef.current,
                      socketId,
                  });
              }
          );

            // Listening for disconnected
            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    toast.success(`${username} left the room.`);
                    setClients((prev) => {
                        return prev.filter(
                            (client) => client.socketId !== socketId
                        );
                    });
                }
            );
        };
        init();
        return () => {
          if (socketRef.current) {
            // console.log(socketRef.current);
            socketRef.current.disconnect();
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.off(ACTIONS.DISCONNECTED);
        }
        };
    }, []);

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID has been copied to your clipboard");
    } catch (err) {
      toast.error("Could not copy the Room ID");
      console.error(err);
    }
  };

  const leaveRoom = () => {
    reactNavigator("/");
  };

  if (!location.state) {
    return <Navigate to="/" />;
  }

  return (
    <ErrorBoundary>
    <div className="grid grid-cols-[230px_1000px] gap-4 h-screen">
      <div className="bg-[#1c1e29] p-4 text-white flex flex-col">
        <div className="flex-1">
          <div className="border-b border-[#424242] pb-2.5">
            <h3>Chat&Code</h3>
          </div>
          <h3>Connected</h3>
          <div className="flex items-center flex-wrap gap-5">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>
        <button className="btn bg-[#4aed88] text-black  text-lg font-bold rounded-md p-2 cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#2b824c]" onClick={copyRoomId}>
          Copy ROOM ID
        </button>
        <br />
        <button className="btn bg-[#4aed88] text-black  text-lg font-bold rounded-md p-2 cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#2b824c]" onClick={leaveRoom}>
          Leave
        </button>
      </div>
      <div >
        <Landing 
        socketRef={socketRef}
        roomId={roomId}
        onCodeChange={(code) => {
            codeRef.current = code;
        }}/>
      </div>
    </div>
    </ErrorBoundary>
   
  );
};

export default EditorPage;
