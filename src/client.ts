export interface WSMessage {
  event: string
  to?: string
  from?: string
  data: any
}

export default class Client {
  url: string
  ws: any
  events: any
  id: string
  peers: Peer[]

  constructor(url: string){
    this.url = url
    this.peers =[]
  }

  connect(){
    // @ts-ignore
    this.ws = new WebSocket(this.url)
    this.ws.onclose = this.onClose.bind(this)
    this.ws.onerror = this.onError.bind(this)
    this.ws.onmessage = this.onMessage.bind(this)
    this.ws.onopen = this.onOpen.bind(this)
    this.events = {
      connectionRequest: this.onConnectionRequest.bind(this),
      connectionAccepted: this.onConnectionAccepted.bind(this),
      addIceCandidate: this.addIceCandidate.bind(this),
      setRemoteDescription: this.setRemoteDescription.bind(this),
    }
  }

  onClose(e){
    console.log("client.onClose", e)
  }

  onError(e){
    console.log("client.onError", e)
  }

  onOpen(e){
    console.log("client.onOpen", e)
  }

  onMessage(e: WSMessage){
    console.log("client.onMessage", e)
    const data = JSON.parse(e.data)
    // console.log("data: ", data)
    // console.log("event: ", data.event)
    try {
      this.events[data.event](data)
    } catch(e){
      console.log(e)
    }
  }

  async send(event, to, data){
    await this.ws.send(JSON.stringify({
      event,
      to,
      data
    }))
  }

  // A new Peer wants to connect
  async onConnectionRequest(message){
    console.log("client.onConnectionRequest()", message)
    try {
      const p: Peer = new Peer(message.from)
      this.peers.push(p)
      p.connect(false, this.onIceCandidate.bind(this), this.onOffer.bind(this))
      await this.send("connectionAccepted", message.from, {})
    } catch(e){
      console.error("ERROR: ", e)
    }
  }

  async onConnectionAccepted(message){
    console.log("client.onConnectionAccepted()", message)
    try {
      const peer = this.peers.find(p => p.id == message.from)
      const offer = await peer.connect(true, this.onIceCandidate.bind(this, peer.id), this.onOffer.bind(this, peer.id))
    } catch(e) {
      console.error("ERROR: ", e)
    }
  }

  async setRemoteDescription(message){
    console.log("setRemoteDescription", message)
    try {
      const peer = this.peers.find(p => p.id == message.from)
      // @ts-ignore
      const description = new RTCSessionDescription()
      description.type = message.data.offer.type
      description.sdp = message.data.offer.sdp
      await peer.connection.setRemoteDescription(description)

      if(!peer.connection.isHost){
        const offer = await peer.connection.createAnswer()
        await peer.connection.setLocalDescription(offer)
        this.send("setRemoteDescription", peer.id, {offer})
      }
    } catch(e){
      console.error("ERROR: ", e)
    }
  }

  async addIceCandidate(message){
    console.log("addIceCandidate", message)
    try {
      const peer = this.peers.find(p => p.id == message.from)
      // @ts-ignore
      const candidate = new RTCIceCandidate(message.data.candidate)
      console.log("setting ice candidate: ", candidate)
      await peer.connection.addIceCandidate(candidate)
    } catch(e){
      console.error("ERROR: ", e)
      throw e
    }
  }

  async getPeers(){
    // @ts-ignore
    const res = await fetch("https://7pd7gfpem8.execute-api.us-west-2.amazonaws.com/dev/peers").then(data => data.json())
    this.peers = res.map(result => new Peer(result.id, result.name))
    return res
  }

  async requestConnection(peer){
    console.log("requestConnection: ", peer)
    await this.send("connectionRequest", peer.id, {})
  }

  async onIceCandidate(id, e){
    console.log("onIceCandidate: ", e)
    if(e && e.candidate){
      const candidate = e.candidate.toJSON()
      this.send("addIceCandidate", id, {candidate})
    }
  }

  async onOffer(id, offer){
    this.send("setRemoteDescription", id, {offer})
  }
}


export class Peer {
  id: string
  name?: string
  connection: Connection

  constructor(id: string, name?: string){
    this.id = id
    this.name = name
    this.connection = null
  }

  async connect(isHost=false, onicecandidate, onoffer: any){
    this.connection = new Connection(this.id, isHost)
    this.connection.pc.onicecandidate = onicecandidate
    if(isHost){
      const offer = await this.connection.createOffer()
      await this.connection.setLocalDescription(offer)
      onoffer(this.connection.pc.localDescription)
    }
  }
}

export class Connection {
  to: string
  isHost: boolean
  pc: any
  dc: any

  constructor(to: string, isHost: boolean=false){
    this.to = to
    this.isHost = isHost

    // @ts-ignore
    this.pc = new RTCPeerConnection(null)
    this.pc.ondatachannel = this.ondatachannel.bind(this)

    if(isHost){
      this.dc = this.pc.createDataChannel(this.to)
      this.dc.onopen = this.onopen.bind(this)
      this.dc.onclose = this.onclose.bind(this)
    }
  }

  // pc events
  ondatachannel(e){
    console.log("ondatachannel(): to", this.to)

    if(!this.isHost){
      this.dc = e.channel
      this.dc.onopen = this.onopen.bind(this)
      this.dc.onclose = this.onclose.bind(this)
      this.dc.onmessage = this.onmessage.bind(this)
    }
  }


  // dc events
  onopen(e){
    console.log("onopen(): to", this.to)
    console.log("onopen(): e", e)
    this.send("DATA!!!")
  }

  onclose(e){
    console.log("onclose(): to", this.to)
  }

  onmessage(e){
    console.log("onmessage(): to", this.to)
    console.log(e)
  }

  send(data: any){
    this.dc.send(data)
  }

  async close(){
    await this.dc.close()
    await this.pc.close()

    this.dc = null
    this.pc = null
  }


  async addIceCandidate(candidate){
    console.log("addIceCandidate(): to", this.to)
    return await this.pc.addIceCandidate(candidate)
  }

  async createOffer(){
    console.log("createOffer(): to", this.to)
    return await this.pc.createOffer()
  }

  async setLocalDescription(desc){
    console.log("setLocalDescription(): to", this.to)
    return await this.pc.setLocalDescription(desc)
  }

  async setRemoteDescription(desc){
    console.log("setRemoteDescription(): to", this.to)
    return await this.pc.setRemoteDescription(desc)
  }

  async createAnswer(){
    console.log("createAnswer(): to", this.to)
    return await this.pc.createAnswer()
  }

}
