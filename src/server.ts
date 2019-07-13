// @ts-ignore
import * as AWS from 'aws-sdk'
import * as DB from './db'
import Peer from './peer'

export const connect = async (event, context, callback) => {
  const peer = new Peer(event.requestContext.connectionId)
  try {
    await DB.createPeer(peer)
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
  const peer = new Peer(event.requestContext.connectionId)
  try {
    await DB.deletePeer(peer.id)
    const response = {
      statusCode: 200,
      body: "OK"
    }
    callback(null, response)
  } catch(e){
    callback(null, e.message)
  }
}


export const init = async (event, context, callback) => {
  console.log("event", event)

  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
  })

  const data = JSON.parse(event.body)
  const to = data.to

  console.log("sending: ", data)
  console.log("to: ", to)

  data.from = event.requestContext.connectionId
  delete data.to

  try {
    await apigwManagementApi.postToConnection({ ConnectionId: to, Data: JSON.stringify(data) }).promise()
    return { statusCode: 200, body: 'sent' }
  } catch (e) {
    if (e.statusCode === 410) {
      console.log(`Found stale connection, deleting ${to}`)
      const peer = new Peer(to)
      await DB.deletePeer(peer.id)
      return { statusCode: 404, body: "Peer not found"}
    } else {
      throw e
      return { statusCode: 500, body: e.stack }
    }
  }
}

export const setDescription = async (event, context, callback) => {
  console.log("event", event)
  console.log("event.body", event.body)

  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
  })

  const postData = JSON.parse(event.body).data
  try {
    await apigwManagementApi.postToConnection({ ConnectionId: postData.to, Data: postData }).promise()
  } catch (e) {
    if (e.statusCode === 410) {
      // console.log(`Found stale connection, deleting ${connectionId}`);
      // await ddb.delete({ TableName: TABLE_NAME, Key: { connectionId } }).promise();
    } else {
      throw e
    }
  }
}



// Non-WS
export const listPeers = async (event, context, callback) => {
  try {
    const peers = await DB.listPeers()
    console.log("peers: ", peers)
    const response = {
      statusCode: 200,
      body: JSON.stringify(peers),
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    }
    callback(null, response)
  } catch(e){
    console.log("catch: ", e)
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
