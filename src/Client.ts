import Connection from './Connection'

export default class Client {
  connections: Connection[]
  url: string
  ws: any
  events: any
  id: string
  peers: any

  constructor(url: string){
    this.url = url
  }

  connect(){
    // @ts-ignore
    this.ws = new WebSocket(this.url)
    this.ws.onclose = this.onClose.bind(this)
    this.ws.onerror = this.onError.bind(this)
    this.ws.onmessage = this.onMessage.bind(this)
    this.ws.onopen = this.onOpen.bind(this)
    this.events = {
      update: this.update.bind(this)
    }
  }

  onClose(e){
    console.log("client.onClose", e)
  }

  onError(e){
    console.log("client.onError", e)
  }

  onMessage(e){
    // console.log("client.onMessage", e)
    const message = JSON.parse(e.data)
    this.events[message.event](message.data)
  }

  onOpen(e){
    console.log("client.onOpen", e)
    // this.ws.send({message: "hey server"})
  }

  send(event, to, data){
    this.ws.send(JSON.stringify({
      event,
      to,
      data,
      from: this.id
    }))
  }

  getPeers(){

  }

  setRemoteDescription(data){

  }

  addIceCandidate(data){

  }

}
