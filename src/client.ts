export interface WSMessage {
  event: string
  to?: string
  from?: string
  data: any
}

export type ClientEventType = "ws_open" | "ws_error" | "ws_message" | "ws_close"
  | "connection_request" | "connection_accepted" | "add_ice_candidate" | "set_remote_description"

export default class Client {
  url: string
  ws: any
  events: any
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
    this.addListener("add_ice_candidate", this.addIceCandidate.bind(this))
    this.addListener("set_remote_description", this.setRemoteDescription.bind(this))
  }

  async getPeers(){
    // @ts-ignore
    const res = await fetch("https://7pd7gfpem8.execute-api.us-west-2.amazonaws.com/dev/peers").then(data => data.json())
    this.peers = res.map(result => new Peer(result.id, result.name))
    return res
  }

  addListener(eventType: ClientEventType, listener: (message: any) => Promise<void>){
    if(this.listeners[eventType]){
      this.listeners[eventType].push(listener)
    } else {
      this.listeners[eventType] = [listener]
    }
  }

  onEvent(eventType: ClientEventType, event: any){
    if(this.listeners[eventType]){
      this.listeners[eventType].forEach(listener => {listener(event)})
    }
  }

  connect(){
    // @ts-ignore
    this.ws = new WebSocket(this.url)

    this.ws.addEventListener('open', (event)=>{this.onEvent("ws_open", event)})
    this.ws.addEventListener('close', (event)=>{this.onEvent("ws_close", event)})
    this.ws.addEventListener('error', (event)=>{this.onEvent("ws_error", event)})
    this.ws.addEventListener('message', (event)=>{this.onEvent("ws_message", event)})
    this.ws.addEventListener('message', (e: WSMessage)=>{
      const data = JSON.parse(e.data)
      try {
        this.onEvent(data.eventType, data)
      } catch(e){
        console.error("ws_message Error: ", e)
      }
    })
  }

  async send(eventType: ClientEventType, to, data){
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
        const p: Peer = new Peer(message.from, this.listeners)
        this.peers.push(p)
        p.connect(false, this.onIceCandidate.bind(this), this.onOffer.bind(this))
        await this.send("connection_accepted", message.from, {})
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
        this.send("set_remote_description", peer.id, {offer})
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

  async requestConnection(peer){
    console.log("requestConnection: ", peer)
    await this.send("connection_request", peer.id, {})
  }

  async onIceCandidate(id, e){
    console.log("onIceCandidate: ", e)
    if(e && e.candidate){
      const candidate = e.candidate.toJSON()
      this.send("add_ice_candidate", id, {candidate})
    }
  }

  async onOffer(id, offer){
    this.send("set_remote_description", id, {offer})
  }

  async onDCOpen(peer: Peer, event){
    if(this.debug) console.log("onDCOpen: ", event)

  }
  async onDCMessage(peer: Peer, event){
    if(this.debug) console.log("onDCMessage: ", event)

  }
}


export class Peer {
  id: string
  name?: string
  listeners: any[]
  connection: Connection

  constructor(id: string, listeners: any, name?: string){
    this.id = id
    this.listeners = listeners
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
