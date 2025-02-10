
import { useEffect, useState } from "react";
import { FaFileCode } from "react-icons/fa";
import { useAuthContext } from "../../context/AuthContext"; // Assuming the context provides user data
import useConversation from "../../zustand/useConversation";
import MessageInput from "./MessageInput";
import Messages from "./Messages";
import { TiMessages } from "react-icons/ti";

const MessageContainer = () => {
  
  const { selectedConversation, setSelectedConversation } = useConversation();
  const { authUser } = useAuthContext(); // Assuming authUser contains the current user's data
  
  const [username, setUsername] = useState(authUser?.fullName || ""); // Set the username from auth context

  useEffect(() => {
    // Cleanup function on unmount
    return () => setSelectedConversation(null);
  }, [setSelectedConversation]);


  const createNewRoom = () => {
    // console.log("Username from messagecontainer", username);
    const EditorUrl = import.meta.env.VITE_RAPID_API_EDITOR_URL+`editor/`;
    // console.log("Redirecting to", url);
    window.open(EditorUrl, "_blank").focus();
  };

  return (
    <div className="md:min-w-[450px] flex flex-col">
      {!selectedConversation ? (
        <NoChatSelected />
      ) : (
        <>
          {/* Header */}
          <div className="bg-slate-500 px-4 py-2 mb-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="label-text">To:</span>{" "}
                <span className="text-gray-900 font-bold">
                  {selectedConversation.fullName}
                </span>
              </div>
              <div>
                <span onClick={createNewRoom} className="cursor-pointer">
                  <FaFileCode />
                </span>
              </div>
            </div>
          </div>
          <Messages />
          <MessageInput />
        </>
      )}
    </div>
  );
};

const NoChatSelected = () => {
  const { authUser } = useAuthContext();
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="px-4 text-center sm:text-lg md:text-xl text-gray-200 font-semibold flex flex-col items-center gap-2">
        <p>Welcome 👋 {authUser.fullName} ❄</p>
        <p>Select a chat to start messaging</p>
        <TiMessages className="text-3xl md:text-6xl text-center" />
      </div>
    </div>
  );
};

export default MessageContainer;
