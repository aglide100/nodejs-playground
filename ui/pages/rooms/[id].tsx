import React, {
  ReactElement,
  ReactNode,
  useEffect,
  useState,
  useRef,
  MutableRefObject,
  useCallback,
} from "react";
import { useRouter } from "next/router";
import * as ws_manager from "../../utils/ws_manager";
import * as rtc_manager from "../../utils/rtc_manager";
import io, { SocketIOClient } from "socket.io-client";
import Video from "../../components/Video";

type WebRTCUser = {
  id: string;
  email: string;
  stream: MediaStream;
};

const pc_config = {
  iceServers: [
    // {
    //   urls: 'stun:[STUN_IP]:[PORT]',
    //   'credentials': '[YOR CREDENTIALS]',
    //   'username': '[USERNAME]'
    // },
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};
// const SOCKET_SERVER_URL = "ws://localhost:8888";

const SOCKET_SERVER_URL = "wss://wss.non-contact-karaoke.xyz";

let wsclient: ws_manager.WsManager;
let rtcclient: rtc_manager.RtcManager;

const Room: React.FC = ({}) => {
  const router = useRouter();
  const { id } = router.query;

  const [chatMsg, setChatMsg] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const socketRef = useRef<SocketIOClient.Socket>();
  const pcsRef = useRef<{ [socketId: string]: RTCPeerConnection }>({});
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream>();
  const [users, setUsers] = useState<WebRTCUser[]>([]);

  // async function getWsManager() {
  //   var clientTemp = await ws_manager.WsManager.getInstance();
  //   return clientTemp;
  // }

  const getLocalStream = useCallback(async () => {
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: 640,
          height: 480,
        },
      });
      localStreamRef.current = localStream;
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
      if (!socketRef.current) return;
      socketRef.current.emit("join_room", {
        room: { id },
        email: "sample@naver.com",
      });
    } catch (e) {
      console.log(`getUserMedia error: ${e}`);
    }
  }, []);

  const createPeerConnection = useCallback(
    (socketID: string, email: string) => {
      try {
        const pc = new RTCPeerConnection(pc_config);

        pc.onicecandidate = (e) => {
          if (!(socketRef.current && e.candidate)) return;
          console.log("onicecandidate");
          socketRef.current.emit("candidate", {
            candidate: e.candidate,
            candidateSendID: socketRef.current.id,
            candidateReceiveID: socketID,
          });
        };

        pc.oniceconnectionstatechange = (e) => {
          console.log(e);
        };

        pc.ontrack = (e) => {
          console.log("ontrack success");
          setUsers((oldUsers) =>
            oldUsers
              .filter((user) => user.id !== socketID)
              .concat({
                id: socketID,
                email,
                stream: e.streams[0],
              })
          );
        };

        if (localStreamRef.current) {
          console.log("localstream add");
          localStreamRef.current.getTracks().forEach((track) => {
            if (!localStreamRef.current) return;
            pc.addTrack(track, localStreamRef.current);
          });
        } else {
          console.log("no local stream");
        }

        return pc;
      } catch (e) {
        console.error(e);
        return undefined;
      }
    },
    []
  );

  // useEffect(() => {
  //   if (!isLoaded && router.isReady) {
  //     let roomID = JSON.stringify(router.query.id);
  //     console.log("roomID: " + roomID);

  //     getWsManager().then(function (wsclientTemp) {
  //       setIsLoaded(true);
  //     });
  //   }
  // }, [router.isReady]);

  useEffect(() => {
    socketRef.current = io.connect(SOCKET_SERVER_URL);
    getLocalStream();

    socketRef.current.on(
      "all_users",
      (allUsers: Array<{ id: string; email: string }>) => {
        allUsers.forEach(async (user) => {
          if (!localStreamRef.current) return;
          const pc = createPeerConnection(user.id, user.email);
          if (!(pc && socketRef.current)) return;
          pcsRef.current = { ...pcsRef.current, [user.id]: pc };
          try {
            const localSdp = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            });
            console.log("create offer success");
            await pc.setLocalDescription(new RTCSessionDescription(localSdp));

            socketRef.current.emit("offer", {
              sdp: localSdp,
              offerSendID: socketRef.current.id,
              offerSendEmail: "offerSendSample@sample.com",
              offerReceiveID: user.id,
            });
          } catch (e) {
            console.error(e);
          }
        });
      }
    );

    socketRef.current.on(
      "getOffer",
      async (data: {
        sdp: RTCSessionDescription;
        offerSendID: string;
        offerSendEmail: string;
      }) => {
        const { sdp, offerSendID, offerSendEmail } = data;
        console.log("get offer");
        if (!localStreamRef.current) return;
        const pc = createPeerConnection(offerSendID, offerSendEmail);
        if (!(pc && socketRef.current)) return;
        pcsRef.current = { ...pcsRef.current, [offerSendID]: pc };
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          console.log("answer set remote description success");
          const localSdp = await pc.createAnswer({
            offerToReceiveVideo: true,
            offerToReceiveAudio: true,
          });
          await pc.setLocalDescription(new RTCSessionDescription(localSdp));
          socketRef.current.emit("answer", {
            sdp: localSdp,
            answerSendID: socketRef.current.id,
            answerReceiveID: offerSendID,
          });
        } catch (e) {
          console.error(e);
        }
      }
    );

    socketRef.current.on(
      "getAnswer",
      (data: { sdp: RTCSessionDescription; answerSendID: string }) => {
        const { sdp, answerSendID } = data;
        console.log("get answer");
        const pc: RTCPeerConnection = pcsRef.current[answerSendID];
        if (!pc) return;
        pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    );

    socketRef.current.on(
      "getCandidate",
      async (data: {
        candidate: RTCIceCandidateInit;
        candidateSendID: string;
      }) => {
        console.log("get candidate");
        const pc: RTCPeerConnection = pcsRef.current[data.candidateSendID];
        if (!pc) return;
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log("candidate add success");
      }
    );

    socketRef.current.on("user_exit", (data: { id: string }) => {
      if (!pcsRef.current[data.id]) return;
      pcsRef.current[data.id].close();
      delete pcsRef.current[data.id];
      setUsers((oldUsers) => oldUsers.filter((user) => user.id !== data.id));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      users.forEach((user) => {
        if (!pcsRef.current[user.id]) return;
        pcsRef.current[user.id].close();
        delete pcsRef.current[user.id];
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createPeerConnection, getLocalStream]);

  return (
    <>
      <div className="text-green-500">room id : {id}</div>
      <video
        style={{
          width: 240,
          height: 240,
          margin: 5,
          backgroundColor: "black",
        }}
        muted
        ref={localVideoRef}
        autoPlay
        playsInline
      />
      {users.map((user, index) => (
        <Video key={index} email={user.email} stream={user.stream} />
      ))}
      <input
        id="chat_message"
        type="text"
        autoComplete="off"
        placeholder="Type message here..."
        onChange={(e) => {
          setChatMsg(e.target.value);
        }}
      />
      <div
        id="send"
        className="options__button"
        onClick={(e) => {
          e.preventDefault();
          wsclient.sendChatMsg(chatMsg, id);
        }}
      >
        Send Message!
      </div>
    </>
  );
};

export default Room;
