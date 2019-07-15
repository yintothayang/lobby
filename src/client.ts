// import Peer from './peer'


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
      init: this.init.bind(this)
    }
  }

  onClose(e){
    console.log("client.onClose", e)
  }

  onError(e){
    console.log("client.onError", e)
  }

  onMessage(e: WSMessage){
    console.log("client.onMessage", e)
    const data = JSON.parse(e.data)
    console.log("data: ", data)
    console.log("action: ", data.action)
    try {
      this.events[data.action](data)
    } catch(e){
      console.log(e)
    }
  }

  onOpen(e){
    console.log("client.onOpen", e)
  }

  send(action, to, data){
    this.ws.send(JSON.stringify({
      action: 'send',

      to,
      data
    }))
  }

  // On connection request
  init(data){
    console.log("client.init()", data)

    // Add the Peer
    const p: Peer = new Peer(data.from)
    p.connect()
    this.peers.push(p)
  }

  setRemoteDescription(data){

  }

  addIceCandidate(data){

  }

  async getPeers(){
    // @ts-ignore
    const res = await fetch("https://7pd7gfpem8.execute-api.us-west-2.amazonaws.com/dev/peers").then(data => data.json())
    this.peers = res.map(result => new Peer(result.id, result.name))
    return res
  }

  connectToPeer(peer){
    this.send("init", peer.id, {})
    // peer.connect()
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

  async connect(){
    this.connection = new Connection(this.id)
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
    this.pc = new RTCPeerConnection()
    this.pc.ondatachannel = this.ondatachannel.bind(this)

    this.dc = this.pc.createDataChannel(this.to)
    this.dc.onopen = this.onopen.bind(this)
    this.dc.onclose = this.onclose.bind(this)

    this.pc.onicecandidate = this.onicecandidate.bind(this)

  }

  // pc events
  ondatachannel(e){
    console.log("ondatachannel(): to", this.to)

    // TODO, if not isHost?
    this.dc = e.channel
    this.dc.onopen = this.onopen.bind(this)
    this.dc.onclose = this.onclose.bind(this)
    this.dc.onmessage = this.onmessage.bind(this)
  }

  onicecandidate(e){
    // TODO send to Peer
    // localConnection.onicecandidate = e => !e.candidate
    //   || remoteConnection.addIceCandidate(e.candidate)
    //   .catch(handleAddCandidateError);
  }

  // dc events
  onopen(e){
    console.log("onopen(): to", this.to)
  }

  onclose(e){
    console.log("onclose(): to", this.to)
  }

  onmessage(e){
    console.log("onmessage(): to", this.to)
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
