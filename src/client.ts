import Peer from './peer'

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
      action,
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
    peer.connect()
  }

}
