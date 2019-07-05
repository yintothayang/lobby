export default class Client {
  url: string
  ws: any
  events: any
  id: string
  peers: any
  connections: any

  constructor(url: string){
    this.url = url
  }

  start(){
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

  update(data){
    // console.log("update", data)
    this.id = data.id
    this.peers = data.clients.filter(c => c != this.id)
  }

  // Override
  setRemoteDescription(data){}

  // Override
  addIceCandidate(data){}

}
