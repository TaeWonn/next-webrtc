import {useEffect, useRef} from "react";
import {Socket} from "socket.io-client";
import {SocketHelper} from "@/common/socket";

export default function Home() {
  const socketRef = useRef<Socket>();
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection>();
  const roomName = 'test';
  const helper = new SocketHelper(pcRef, socketRef, roomName)


  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }
      if (!(pcRef.current && socketRef.current)) {
        return;
      }
      stream.getTracks().forEach((track) => {
        if (!pcRef.current) {
          return;
        }
        pcRef.current.addTrack(track, stream);
      });

      pcRef.current.onicecandidate = (e) => {
        if (e.candidate) {
          if (!socketRef.current) {
            return;
          }
          console.log("recv candidate");
          socketRef.current.emit("candidate", {candidate: e.candidate, roomName});
        }
      };

      pcRef.current.ontrack = (e) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      };
    } catch (e) {
      console.error(e);
    }
  };


  useEffect(() => {
    helper.init();

    getMedia();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, []);

  return (
      <div>
        <video
            id="remotevideo"
            style={{
              width: 240,
              height: 240,
              //backgroundColor: "black",
            }}
            ref={myVideoRef}
            autoPlay
            //muted={true}
        />
        <video
            id="remotevideo"
            style={{
              width: 240,
              height: 240,
              //backgroundColor: "black",
            }}
            ref={remoteVideoRef}
            autoPlay
        />
      </div>
  );
}