// @ts-ignore
import * as AWS from 'aws-sdk'
import Peer from './peer'

const DB = new AWS.DynamoDB.DocumentClient()

export async function createPeer(peer: Peer){
  const timestamp = new Date().getTime()
  const params = {
    TableName: "peers",
    Item: {
      id: peer.id,
      name: peer.name,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  }

  return await DB.put(params).promise()
}

export async function deletePeer(id: string){
  const params = {
    TableName: "peers",
    Key: {id}
  };

  return await DB.delete(params).promise()
}

export async function getPeer(id: string){
  const params = {
    TableName: "peers",
    Key: {id}
  }
  return await DB.get(params).promise()
}

export async function listPeers(){
  const params = {
    TableName: "peers",
  }

  const peers = await DB.scan(params).promise()
  return peers.Items
}
