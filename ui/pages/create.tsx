import React, { useState, useEffect } from "react";

import { WsManager } from "../utils/ws_manager";
let client: WsManager;

const CreatePage: React.FC<{}> = ({}) => {
  const [roomTitle, setRoomTitle] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  async function getWsManager() {
    var clientTemp = await WsManager.getInstance();
    return clientTemp;
  }

  useEffect(() => {
    if (!isLoaded) {
      setIsLoaded(true);
      getWsManager()
        .then(function (clientTemp) {
          return (client = clientTemp);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  });

  return (
    <>
      <div className="main__message_container">
        <input
          value={roomTitle}
          onChange={(e) => {
            setRoomTitle(e.target.value);
          }}
          placeholder="방 제목을 입력해주세요!"
        />
        <div
          onClick={(e) => {
            e.preventDefault();
            if (isLoaded) {
              client.createNewRoom(roomTitle);
            }
          }}
        >
          Create New room!
        </div>
      </div>
    </>
  );
};

export default CreatePage;
