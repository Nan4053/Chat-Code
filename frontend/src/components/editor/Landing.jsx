import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import { classnames } from "../../utils/general.js";
import { languageOptions } from "../../constants/languageOptions.js";
import "react-toastify/dist/ReactToastify.css";
import useKeyPress from "../../hooks/useKeyPress";
import OutputWindow from "./OutputWindow.jsx";
import CustomInput from "./CustomInput.jsx";
import OutputDetails from "./OutputDetails.jsx";
import LanguagesDropdown from "./LanguagesDropdown.jsx";

const javascriptDefault = `
const binarySearch = (arr, target) => {
 return binarySearchHelper(arr, target, 0, arr.length - 1);
};

const binarySearchHelper = (arr, target, start, end) => {
 if (start > end) {
   return false;
 }
 let mid = Math.floor((start + end) / 2);
 if (arr[mid] === target) {
   return mid;
 }
 if (arr[mid] < target) {
   return binarySearchHelper(arr, target, mid + 1, end);
 }
 if (arr[mid] > target) {
   return binarySearchHelper(arr, target, start, mid - 1);
 }
};

const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const target = 5;
console.log(binarySearch(arr, target));
`;
const Landing = ({ socketRef  }) => {
 
  const [code, setCode] = useState(javascriptDefault);
  const [customInput, setCustomInput] = useState("");
  const [outputDetails, setOutputDetails] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [language, setLanguage] = useState(languageOptions[0]); 
  const enterPress = useKeyPress("Enter");
  const ctrlPress = useKeyPress("Control");
 
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on('updateContent', (updatedContent) => {
        setCode(updatedContent);
      });

      return () => {
        socketRef.current.off('updateContent');
      };
    }
  }, [socketRef]);

  const handleEdit = (event) => {
    const newCode= event.target.value;
    // console.log("newCode");
    setCode(newCode);
    socketRef.current.emit('edit', newCode);
  };
 
  const onSelectChange = (sl) => {
    // console.log("selected Option...", sl);
    setLanguage(sl);
  };
 
  useEffect(() => {
    if (enterPress && ctrlPress) {
      // console.log("enterPress", enterPress);
      // console.log("ctrlPress", ctrlPress);
      handleCompile();
    }
  }, [ctrlPress, enterPress]);
  
 // Handle the compile logic
  const handleCompile = () => {
    setProcessing(true);
    const formData = {
      language_id: language.id,
      source_code: btoa(code),
      stdin: btoa(customInput),
    };
    const options = {
      method: "POST",
      url: import.meta.env.VITE_RAPID_API_URL + "submissions",
      params: {
        base64_encoded: "true",
        wait: "false",
        fields: "*",
      },
      headers: {
        "x-rapidapi-key": import.meta.env.VITE_RAPID_API_KEY,
        "x-rapidapi-host": import.meta.env.VITE_RAPID_API_HOST,
        "Content-Type": "application/json",
      },
      data: formData,
    };

    axios
      .request(options)
      .then(function (response) {
        const token = response.data.token;
        checkStatus(token);
      })
      .catch((err) => {
        console.error("Error during compile:", err);
        setProcessing(false);
        showErrorToast();
      });
  };
//check output status
  const checkStatus = async (token) => {
    const options = {
      method: "GET",
      url: import.meta.env.VITE_RAPID_API_URL + "submissions/" + token,
      params: {
        base64_encoded: "true",
        fields: "*",
      },
      headers: {
        "x-rapidapi-key": import.meta.env.VITE_RAPID_API_KEY,
        "x-rapidapi-host": import.meta.env.VITE_RAPID_API_HOST,
      },
    };

    try {
      let response = await axios.request(options);
      let statusId = response.data.status?.id;

      if (statusId === 1 || statusId === 2) {
        setTimeout(() => {
          checkStatus(token);
        }, 2000);
        return;
      } else {
        setProcessing(false);
        setOutputDetails(response.data);
        showSuccessToast("Compiled Successfully!");
      }
    } catch (err) {
      setProcessing(false);
      showErrorToast();
    }
  };
  const showSuccessToast = (msg) => {
    toast.success(msg || `Compiled Successfully!`, {
      position: "top-right",
      autoClose: 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };
  const showErrorToast = (msg, timer) => {
    toast.error(msg || `Something went wrong! Please try again.`, {
      position: "top-right",
      autoClose: timer ? timer : 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  return (
    <>
      <ToastContainer autoClose={2000} />
      <div className="flex flex-row">
        <div className="px-4">
          <LanguagesDropdown onSelectChange={onSelectChange} />
        </div>
      </div>

      <div className="flex flex-row space-x-4 items-start px-4 py-4">
      
        <div className="flex flex-col flex-shrink-0 w-[670px] h-[500px]">
        
          <textarea id="codeEditor" value={code}
                onChange={handleEdit}
                rows={50}
                cols={90} ></textarea>
        </div>

        <div className="right-container flex flex-shrink-0 w-[30%] flex-col">
          <OutputWindow outputDetails={outputDetails} />
          <div className="flex flex-col">
            <CustomInput customInput={customInput} setCustomInput={setCustomInput} />
            <button
              onClick={handleCompile}
              disabled={!code}
              className={classnames(
                "mt-4 border-2 border-black z-10 rounded-md shadow-[5px_5px_0px_0px_rgba(0,0,0)] px-4 py-2 hover:shadow transition duration-200 bg-white flex-shrink-0",
                !code ? "opacity-50" : ""
              )}
            >
              {processing ? "Processing..." : "Compile and Execute"}
            </button>
            
          </div>
          {outputDetails && <OutputDetails outputDetails={outputDetails} />}
        </div>
      </div>
    </>
  );
};

export default Landing;