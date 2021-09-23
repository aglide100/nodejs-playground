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
  const [pc, setPc] = useState<RTCPeerConnection>();

  let localVideoRef = useRef<HTMLVideoElement>(null);
  let remoteVideoRef = useRef<HTMLVideoElement>(null);

  async function connSocket() {
    return (client = await asyncSocket());
    // setTimeout(function () {
    //   return client.sendMsg("", "answer", "server");
    // }, 1000);

    // client = await new ws_manager.WsManager();
  }

  function asyncSocket() {
    var client = new ws_manager.WsManager();
    return client;
  }

  useEffect(() => {
    if (init) {
      connSocket().catch((error) => {
        console.log(error);
      });
      setInit(false);
    }
  });

  return (
    <div>
      {/* <video
        style={{
          width: 240,
          height: 240,
          margin: 5,
          backgroundColor: "black",
        }}
        muted
        ref={localVideoRef}
        autoPlay
      ></video>
      <video
        id="remotevideo"
        style={{
          width: 240,
          height: 240,
          margin: 5,
          backgroundColor: "black",
        }}
        ref={remoteVideoRef}
        autoPlay
      ></video> */}
      <div>your ID: {userID}</div>

      <div className="main__message_container">
        <input
          id="chat_message"
          type="text"
          autoComplete="off"
          placeholder="Type message here..."
        />
        <div
          id="send"
          className="options__button"
          onClick={(e) => {
            e.preventDefault();
            client.sendMsg("", "chat", "");
            // client.createNewRoom();
          }}
        >
          Send Message!
        </div>
        <div
          onClick={(e) => {
            e.preventDefault();
            client.createNewRoom();
          }}
        >
          Create New room!
        </div>
      </div>
    </div>
  );
};
export default Test;
