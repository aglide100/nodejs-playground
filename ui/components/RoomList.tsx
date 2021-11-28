import React, { useRef, useState } from "react";
import { useEffect } from "react";
import * as rtc_pc from "../utils/rtc_pc_config";
import * as ws_manager from "../utils/ws_manager";

let client: ws_manager.WsManager;

const Test: React.FC<{}> = ({}) => {
  // const userID = client.getClientID();

  const [init, setInit] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userID, setUserID] = useState("");
  const [roomID, setRoomID] = useState("");
  const [rooms, setRooms] = useState([]);
  // const [chatMsg, setChatMsg] = useState("");

  // let localVideoRef = useRef<HTMLVideoElement>(null);
  // let remoteVideoRef = useRef<HTMLVideoElement>(null);

  async function connSocket() {
    var clientTemp = await ws_manager.WsManager.getInstance();
    return clientTemp;
  }

  useEffect(() => {
    // let newPC = new RTCPeerConnection(rtc_pc.pc_config);
    if (!isLoaded) {
      connSocket()
        .then(function (clientTemp) {
          setTimeout(function () {
            setIsLoaded(true);
            setUserID(clientTemp.getClientID());
            // let list = client.getRooms();
            // if (list != undefined) {
            //   alert(list);
            // }
          }, 1500);

          return (client = clientTemp);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  });

  return (
    <div>
      <div>your ID: {userID}</div>
      <div>room ID: </div>

      <div className="main__message_container">
        <div
          onClick={(e) => {
            e.preventDefault();
            if (isLoaded) {
              client.createNewRoom();
            }
          }}
        >
          Create New room!
        </div>
      </div>
    </div>
  );
};
export default Test;
