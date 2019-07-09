import Connection from './connection'

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
      init: this.init.bind(this)
    }
  }

  onClose(e){
    console.log("client.onClose", e)
  }

  onError(e){
    console.log("client.onError", e)
  }

  onMessage(e){
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
    // this.ws.send({message: "hey server"})
  }

  send(action, to, data){
    this.ws.send(JSON.stringify({
      action,
      to,
      data
    }))
  }

  init(data){
    console.log("client.init()", data)
  }

  setRemoteDescription(data){

  }

  addIceCandidate(data){

  }

  async getPeers(){
    // @ts-ignore
    return await fetch("https://7pd7gfpem8.execute-api.us-west-2.amazonaws.com/dev/peers").then(data => data.json())
  }

}
