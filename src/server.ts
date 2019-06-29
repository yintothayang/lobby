import * as WebSocket from 'ws'

export default class Server {
  wss: WebSocket.Server
  ready: boolean = false
  port: number

  constructor(port: number = 3001){
    this.port = port
  }

  start(cb?){
    this.wss = new WebSocket.Server({
      port: this.port
    }, cb)
    this.wss.on('listening', this.onListening.bind(this))
    this.wss.on('error', this.onError.bind(this))
    this.wss.on('connection', this.onConnection.bind(this))
    this.wss.on('close', this.onClose.bind(this))
  }

  onListening(){
    console.log("onListening")
  }

  onConnection(client){
    console.log('onConnection')
    client.on('message', this.onMessage.bind(this))
    // client.send("hey client")
  }

  onError(e){
    console.log("onError: ", e)
  }

  onClose(e){
    console.log("onClose: ", e)
  }

  onMessage(e){
    console.log("onMessage: ", e)
  }

  onLocalIceCandidate(e){
    console.log("onLocalIceCandidate", e)
  }

  onLocalDescription(e){
    console.log("onLocalDescription", e)
  }

}
