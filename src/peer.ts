import Connection from './connection'

export default class Peer {
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
