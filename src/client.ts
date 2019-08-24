export interface WSMessage {
  event: string
  to?: string
  from?: string
  data: any
}

export type ClientEventType = "ws_open" | "ws_error" | "ws_message" | "ws_close"
  | "connection_request" | "connection_accepted" | "on_ice_candidate" | "add_ice_candidate" | "set_remote_description"
  | "on_offer" | "on_dc_open" | "on_dc_message"

function PeerNotFoundException(message: string){
  this.message = message
  this.name = "PeerNotFoundException"
}

export default class Client {
  url: string
  ws: any
  id: string
  debug: boolean
  peers: Peer[]
  listeners: any

  constructor(url: string, debug: boolean = false){
    this.url = url
    this.debug = debug
    this.peers =[]
    this.listeners = {}

    this.addListener("connection_request", this.onConnectionRequest.bind(this))
    this.addListener("connection_accepted", this.onConnectionAccepted.bind(this))
    this.addListener("on_ice_candidate", this.onIceCandidate.bind(this))
    this.addListener("add_ice_candidate", this.addIceCandidate.bind(this))
    this.addListener("set_remote_description", this.setRemoteDescription.bind(this))
    this.addListener("on_offer", this.onOffer.bind(this))
    this.addListener("on_dc_open", this.onDCOpen.bind(this))
    this.addListener("on_dc_message", this.onDCMessage.bind(this))
  }

  async getPeers(){
    // @ts-ignore
    const res = await fetch("https://7pd7gfpem8.execute-api.us-west-2.amazonaws.com/dev/peers").then(data => data.json())
    // this.peers = res.map(result => new Peer(result.id, this.onEvent.bind(this), result.name))
    return res
  }

  async requestConnection(peerId: string){
    console.log("requestConnection: ", peerId)
    await this.send("connection_request", peerId, {})
  }

  addListener(eventType: ClientEventType, listener: (message: any) => Promise<void>){
    if(this.listeners[eventType]){
      this.listeners[eventType].push(listener)
    } else {
      this.listeners[eventType] = [listener]
    }
  }

  onEvent(eventType: ClientEventType, ...data){
    if(this.listeners[eventType]){
      this.listeners[eventType].forEach(listener => {listener(...data)})
    }
  }

  connect(){
    // @ts-ignore
    this.ws = new WebSocket(this.url)

    this.ws.addEventListener('open', (event)=>{this.onEvent("ws_open", event)})
    this.ws.addEventListener('close', (event)=>{this.onEvent("ws_close", event)})
    this.ws.addEventListener('error', (event)=>{this.onEvent("ws_error", event)})
    this.ws.addEventListener('message', (event)=>{this.onEvent("ws_message", event)})
    this.ws.addEventListener('message', (message: WSMessage)=>{
      console.log("message: ", message)
      const data = JSON.parse(message.data)
      try {
        this.onEvent(data.eventType, data)
      } catch(e){
        console.error("ws_message Error: ", e)
        console.log("current peers: ", this.peers)
      }
    })
  }

  async send(eventType: ClientEventType, to, data){
    console.log("send: ", eventType)
    await this.ws.send(JSON.stringify({
      eventType,
      to,
      data
    }))
  }

  // A new Peer wants to connect
  async onConnectionRequest(message){
    console.log("client.onConnectionRequest()", message)
    try {
      const p: Peer = new Peer(message.from, this.onEvent.bind(this))
      this.addPeer(p)
      await p.connect(false)
      console.log("after p.connect: ", p.connection)
      await this.send("connection_accepted", message.from, {})
    } catch(e){
      console.error("ERROR: ", e)
      console.log("current peers: ", this.peers)
    }
  }

  async onConnectionAccepted(message){
    console.log("client.onConnectionAccepted()", message)
    const peer: Peer = new Peer(message.from, this.onEvent.bind(this))
    this.addPeer(peer)
    const offer = await peer.connect(true)
  }

  async setRemoteDescription(message){
    console.log("setRemoteDescription", message)
    try {
      const peer = this.getPeer(message.from)
      console.log("peer: ", peer)
      // @ts-ignore
      const description = new RTCSessionDescription()
      description.type = message.data.offer.type
      description.sdp = message.data.offer.sdp
      await peer.connection.setRemoteDescription(description)

      if(!peer.connection.isHost){
        const offer = await peer.connection.createAnswer()
        await peer.connection.setLocalDescription(offer)
        this.send("set_remote_description", peer.id, {offer})
      }
    } catch(e){
      console.error("ERROR: ", e)

    }
  }

  async addIceCandidate(message){
    console.log("addIceCandidate", message)
    try {
      const peer = this.getPeer(message.from)
      // @ts-ignore
      const candidate = new RTCIceCandidate(message.data.candidate)
      console.log("setting ice candidate: ", candidate)
      await peer.connection.addIceCandidate(candidate)
    } catch(e){
      console.error("ERROR: ", e)
      throw e
    }
  }

  async onIceCandidate(id, e){
    console.log("onIceCandidate: ", e)
    if(e && e.candidate){
      const candidate = e.candidate.toJSON()
      this.send("add_ice_candidate", id, {candidate})
    }
  }

  async onOffer(to: string, offer){
    this.send("set_remote_description", to, {offer})
  }

  async onDCOpen(peerId: string, event){
    console.log("onDCOpen: ", event)

  }
  async onDCMessage(peerId: string, event){
    console.log("onDCMessage: ", event)
  }

  async rtcSend(peerId: string, data: any){
    try {
      const peer = this.getPeer(peerId)
      peer.connection.send(data)
    } catch(e){
      console.error("ERROR: ", e)
      throw e
    }
  }

  getPeer(id: string){
    const peer = this.peers.find(p => p.id === id)
    if(peer === undefined){
      console.log("peers: ", this.peers)
      throw new PeerNotFoundException("Peer not found with id: " + id)
    }
    return peer
  }

  addPeer(peer: Peer){
    console.log("add peer", peer)
    this.peers.push(peer)
  }
}


export class Peer {
  id: string
  name?: string
  onEvent: any
  connection: Connection

  constructor(id: string, onEvent: any, name?: string){
    this.id = id
    this.onEvent = onEvent
    this.name = name
    this.connection = null
  }

  async connect(isHost=false){
    this.connection = new Connection(this.id, isHost, this.onEvent)
    await this.connection.init()
    console.log("waiting for connection")
    this.connection.pc.onicecandidate = (event)=> {
      this.onEvent("on_ice_candidate", this.id, event)
    }
    if(isHost){
      const offer = await this.connection.createOffer()
      await this.connection.setLocalDescription(offer)
      this.onEvent("on_offer", this.id, this.connection.pc.localDescription)
    }
  }
}

export class Connection {
  to: string
  isHost: boolean
  pc: any
  dc: any
  onEvent: any

  constructor(to: string, isHost: boolean=false, onEvent: any){
    this.to = to
    this.isHost = isHost
    this.onEvent = onEvent
  }

  async init(){
    // @ts-ignore
    this.pc = new RTCPeerConnection(null)
    this.pc.ondatachannel = this.ondatachannel.bind(this)

    if(this.isHost){
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
  onopen(event){
    // console.log("onopen(): to", this.to)
    // console.log("onopen(): e", e)
    this.onEvent("on_dc_open", this.to, event)
    // this.send("DATA!!!")
  }

  onclose(e){
    console.log("onclose(): to", this.to)
  }

  onmessage(event){
    this.onEvent("on_dc_message", this.to, event)
    // console.log("onmessage(): to", this.to)
    // console.log(e)
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
