import * as uuid from 'uuid'
import * as AWS from 'aws-sdk'
import * as db from './db'

const TABLE_NAME: string = process.env.PEER_TABLE

export default class Peer {
  id: string
  name?: string

  constructor(id: string, name?: string){
    this.id = id
    this.name = name
  }

  async save(){
    await db.createPeer(this.id, this.name)
  }

  async delete(){
    await db.deletePeer(this.id)
  }

}
