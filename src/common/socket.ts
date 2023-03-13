import {MutableRefObject} from "react";
import {DefaultEventsMap} from "@socket.io/component-emitter";
import {io, Socket} from "socket.io-client";

export class SocketHelper {
  pcRef:  MutableRefObject<RTCPeerConnection>;
  socketRef: MutableRefObject<Socket<DefaultEventsMap, DefaultEventsMap>>;
  roomName: string;

  constructor(
      pcRef:  MutableRefObject<RTCPeerConnection>,
      socketRef: MutableRefObject<Socket<DefaultEventsMap, DefaultEventsMap>>,
      roomName: string
  ) {
    this.pcRef = pcRef;
    this.socketRef = socketRef;
    this.roomName = roomName;
  }

  init() {
    this.socketRef.current = io("172.30.1.12:3001");
    this.pcRef.current = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    this.socketRef.current.on("all_users", (allUsers: Array<{ id: string }>) => {
      if (allUsers.length > 0) {
        this.createOffer();
      }
    });

    this.socketRef.current.on("getOffer", (sdp: RTCSessionDescription) => {
      console.log("recv Offer");
      this.createAnswer(sdp);
    });

    this.socketRef.current.on("getAnswer", (sdp: RTCSessionDescription) => {
      console.log("recv Answer", sdp);
      if (!this.pcRef.current) {
        console.log('pcref not found')
        return;
      }
      this.pcRef.current.setRemoteDescription(sdp);
    });

    this.socketRef.current.on("getCandidate", async (candidate: RTCIceCandidate) => {

      if (!this.pcRef.current) {
        return;
      }
      console.log('on ice')
      await this.pcRef.current.addIceCandidate(candidate);
    });

    this.socketRef.current.emit("join_room", {
      room: this.roomName,
    });

    this.pcRef.current.onicecandidate = (e) => {
      if (e.candidate) {
        if (!this.socketRef.current) {
          return;
        }
        console.log("recv candidate");
        this.socketRef.current.emit("candidate", {
          candidate: e.candidate,
          roomName: this.roomName
        });
      }
    };
  }

  async createOffer(){
    console.log("create Offer");
    if (!(this.pcRef.current && this.socketRef.current)) {
      return;
    }
    try {
      const sdp = await this.pcRef.current.createOffer();
      await this.pcRef.current.setLocalDescription(sdp);
      console.log("sent the offer");
      this.socketRef.current.emit("offer", {sdp, roomName: this.roomName});
    } catch (e) {
      console.error(e);
    }
  }

  async createAnswer(sdp: RTCSessionDescription) {
    console.log("createAnswer");
    if (!(this.pcRef.current && this.socketRef.current)) {
      return;
    }

    try {
      await this.pcRef.current.setRemoteDescription(sdp);
      const answerSdp = await this.pcRef.current.createAnswer();
      await this.pcRef.current.setLocalDescription(answerSdp);

      console.log("sent the answer");
      this.socketRef.current.emit("answer", {sdp: answerSdp, roomName: this.roomName});
    } catch (e) {
      console.error(e);
      throw e
    }
  }




}
