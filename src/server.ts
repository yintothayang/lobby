import * as WebSocket from 'ws'
import { v4 as uuidv4 } from 'uuid'

export interface Message {
  event: string,
  data: any,
  to: string,
  from: string
}

export default class Server {
  wss: WebSocket.Server
  ready: boolean = false
  port: number
  events: any

  constructor(port: number = 3001){
    this.port = port
    this.events = {
      // listClients: this.listClients.bind(this)
    }
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
    client.uuid = uuidv4()
    client.on('message', this.onMessage.bind(this, client))
    this.wss.clients.forEach(c => {
      c.send(JSON.stringify({
        event: 'update',
        data: {
          // @ts-ignore
          id: c.uuid,
          // @ts-ignore
          clients: [...this.wss.clients].map(c => c.uuid),
        }
      }))
    })
  }

  onError(e){
    console.log("onError: ", e)
  }

  onClose(e){
    console.log("onClose: ", e)
  }

  onMessage(client, e: string){
    const message: Message = JSON.parse(e)

    if(this.events[message.event]){
      this.events[message.event](message.data)
    } else if(message.to === 'all'){
      this.wss.clients.forEach(c => {
        // @ts-ignore
        if(client.id != c.id){
          c.send(JSON.stringify(message))
        }
      })
    } else {
      this.wss.clients.forEach(client => {
        // @ts-ignore
        if(message.to.includes(client.id)){
          client.send(JSON.stringify(message))
        }
      })
    }
  }
}
