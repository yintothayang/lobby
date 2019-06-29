export default class Client {
  url: string
  ws: any

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
  }

  onClose(e){
    console.log("client.onClose", e)
  }

  onError(e){
    console.log("client.onError", e)
  }

  onMessage(e){
    console.log("client.onMessage", e)
  }

  onOpen(e){
    console.log("client.onOpen", e)
    // this.ws.send({message: "hey server"})
  }
}
