import {DataConnection, Peer} from 'peerjs';
import {PeerDto} from "@/common/dto/peer.dto";

export class PeerHelper {
  peer?: Peer;
  conn?: DataConnection;
  myMideaStream?: MediaStream
  retryCount: number = 0;
  peers: PeerDto[] = [];

  constructor(
      roomName: string,
      myMideaStream: MediaStream,
      action: (video: HTMLVideoElement | null, stream: MediaStream) => void
  ) {
    import('peerjs').then(({default: Peer}) => {
      this.peer = new Peer(roomName, {
        host: '172.30.1.12',
        port: 9000,
        path: '/'
      })
      this.myMideaStream = myMideaStream;

      this.peer.on('open', (id) => {
        console.log("voice chat on!", id);
      });

      this.peer.on('connection', conn => {
        conn.on('data', data => {
          console.log(`data: ${data}`)
          conn.send(`hello`)
        })
      })

      this.conn = this.peer.connect(roomName)

      this.conn.on('data', data => {
        console.log(`recv data: ${data}`)
      })

      this.peer.on('call', (call) => {
        console.log('recv call', call)
        call.answer(myMideaStream);

        const video = document.createElement('video');
        video.id = call.peer
        call.on('stream', (userVideoStream: MediaStream) => {
          action(video, userVideoStream);
        });
      })
    })
  }

  callOther(
      other: string,
      stream: MediaStream,
      action: (video: HTMLVideoElement | null, stream: MediaStream) => void
  ) {
    if (!this.peer) {
      this.#retryCall(other, stream, action)
      return;
    }

    const call = this.peer.call(other, stream)
    const peerDto: PeerDto = {}

    call?.on('stream', otherStream => {
      console.log('stream', otherStream)
      const newVideo = this.createVideo(call.peer)
      peerDto.peerId = call.peer;
      peerDto.video = newVideo;
      peerDto.stream = otherStream;
      action(newVideo, otherStream)
      this.#addPeer(peerDto)
    })

    call?.on('close', () => {
      peerDto.video?.remove()
    });

    //add peers
    this.#addPeer(peerDto)

  }

  #retryCall(
      other: string,
      stream: MediaStream,
      action: (video: HTMLVideoElement | null, stream: MediaStream) => void
  ) {
    setTimeout(() => {
      if (this.retryCount > 5) {
        throw Error('peer call failed try 5')
      }
      this.callOther(other, stream, action)
    }, 300)
  }

  #addPeer(peerDto: PeerDto) {
    const findPeer = this.peers.filter(p => p.peerId === peerDto.peerId);

    if (findPeer || peerDto.stream) {
      const peer: PeerDto = findPeer[0]
      if (peer) {
        peer.video!!.srcObject = peerDto.stream!!
      }
      return
    }

    this.peers.push(peerDto)
    this.peer!!.call(peerDto.peerId!!, this.myMideaStream!!)
  }

  createVideo(userId: string): HTMLVideoElement {
    const video = document.createElement('video');
    video.id = userId
    return video;
  }
}