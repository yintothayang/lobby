// @ts-ignore
import * as AWS from 'aws-sdk'
const DDB =  new AWS.DynamoDB.DocumentClient()

export class DB {
  static async createPeer(id: string, name?: string){
    const timestamp = new Date().getTime()
    const params = {
      TableName: "peers",
      Item: {
        id,
        name,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    }

    return await DDB.put(params).promise()
  }

  static async deletePeer(id: string){
    const params = {
      TableName: "peers",
      Key: {id}
    };

    return await DDB.delete(params).promise()
  }

  static async getPeer(id: string){
    const params = {
      TableName: "peers",
      Key: {id}
    }
    return await DDB.get(params).promise()
  }

  static async listPeers(){
    const params = {
      TableName: "peers",
    }
    const peers = await DDB.scan(params).promise()
    return peers.Items
  }

}

export const connect = async (event, context, callback) => {
  const id: string = event.requestContext.connectionId
  try {
    await DB.createPeer(id)
    const response = {
      statusCode: 200,
      body: "OK"
    }
    callback(null, response)
  } catch(e){
    callback(null, e)
  }
}

export const disconnect = async (event, context, callback) => {
  const id: string = event.requestContext.connectionId
  try {
    await DB.deletePeer(id)
    const response = {
      statusCode: 200,
      body: "OK"
    }
    callback(null, response)
  } catch(e){
    callback(null, e.message)
  }
}


export const send = async (event, context, callback) => {
  console.log("event", event)

  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
  })

  const data = JSON.parse(event.body)
  const to = data.to

  console.log("sending: ", data)

  data.from = event.requestContext.connectionId
  delete data.to

  try {
    await apigwManagementApi.postToConnection({ ConnectionId: to, Data: JSON.stringify(data) }).promise()
    return { statusCode: 200, body: 'sent' }
  } catch (e) {
    if (e.statusCode === 410) {
      console.log(`Found stale connection, deleting ${to}`)
      await DB.deletePeer(to)
      return { statusCode: 404, body: "Peer not found"}
    } else {
      throw e
      return { statusCode: 500, body: e.stack }
    }
  }
}

// Non-WS
export const listPeers = async (event, context, callback) => {
  try {
    const peers = await DB.listPeers()
    const response = {
      statusCode: 200,
      body: JSON.stringify(peers),
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    }
    callback(null, response)
  } catch(e){
    console.log("error: ", e)
    callback(null, e.message)
  }
}



// localConnection.createOffer()
//   .then(offer => localConnection.setLocalDescription(offer))
//   .then(() => remoteConnection.setRemoteDescription(localConnection.localDescription))
//   .then(() => remoteConnection.createAnswer())
//   .then(answer => remoteConnection.setLocalDescription(answer))
//   .then(() => localConnection.setRemoteDescription(remoteConnection.localDescription))
//   .catch(handleCreateDescriptionError);
