import * as uuid from 'uuid'
import * as AWS from 'aws-sdk'

const DB = new AWS.DynamoDB.DocumentClient()

export async function createPeer(id: string, name: string){
  const timestamp = new Date().getTime()
  const params = {
    TableName: "peers",
    Item: {
      id,
      name,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };

  return await DB.put(params, (error) => {
    if(error){
      throw error
    }
  })
}

export async function deletePeer(id: string){
  const params = {
    TableName: "peers",
    Key: {id}
  };

  return await DB.delete(params, (error) => {
    if(error){
      throw error
    }
  })
}

export async function getPeer(id: string){
  const params = {
    TableName: "peers",
    Key: {id}
  };

  return await DB.get(params, (error) => {
    if(error){
      throw error
    }
  })
}

export async function listPeers(){
  const params = {
    TableName: "peers",
  };

  return await DB.scan(params, (error, data) => {
    if(error){
      throw error
    }
    return data
  })
}
