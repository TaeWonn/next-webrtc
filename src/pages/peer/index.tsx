import {MediaConnection, Peer} from 'peerjs';
import {useEffect} from "react";
import {useRouter} from "next/router";
import {PeerHelper} from "@/common/peer";


export default function PeerComponent() {
  const route = useRouter();
  const {room} = route.query;
  const roomName: string = room ? room.toString() : '';
  let peer: Peer | null = null;
  let myVideo: HTMLVideoElement | null = null;
  const peers: Map<string, MediaConnection> = new Map();
  let videoGrid: HTMLElement | null = null;


  if (process.browser) {
    videoGrid = document.getElementById('video-grid');
  }

  useEffect(() => {
    myVideo = document.createElement('video');
    myVideo.id = 'me'
    myVideo.muted = true;

    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    }).then(myStream => {
      const helper = new PeerHelper(roomName, myStream, addVideoStream)

      addVideoStream(myVideo, myStream);
      helper.callOther(`${roomName}1`, myStream, addVideoStream)
    })
  }, [roomName])

  function addVideoStream(video: HTMLVideoElement | null, stream: MediaStream) {
    let isExistVideo = existVideo(video);
    if (isExistVideo) {
      isExistVideo.srcObject = stream
      console.log('tr')
      return;
    }
    if (video) {
      console.log('add video', video, stream)
      video.srcObject = stream;
      video.autoplay = true;
      videoGrid?.appendChild(video);
      video.addEventListener('loadedmetadata', () => {
        video.play();
      });
    }
  }

  function existVideo(video: HTMLVideoElement | null): HTMLVideoElement | null {
    let existVideo = null;
    videoGrid?.childNodes?.forEach(v => {

      if (v.id === video?.id) {
        existVideo = v;
      }
    })
    return existVideo;
  }


  return <>
    <div id="video-grid" >
    </div>
  </>
}

