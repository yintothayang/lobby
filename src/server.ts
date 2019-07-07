import * as AWS from 'aws-sdk'
import * as DB from './db'
import Peer from './peer'

export const connect = async (event, context, callback) => {
  const peer = new Peer(event.requestContext.connectionId)
  try {
    await peer.save()
    callback(peer)
  } catch(e){
    callback(e)
  }
}

export const disconnect = async (event, context, callback) => {
  const peer = new Peer(event.requestContext.connectionId)
  try {
    await peer.delete()
    callback(peer)
  } catch(e){
    callback(e)
  }
}

export const setRemoteDescription = async (event, context, callback) => {
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
      body: JSON.stringify(peers)
    };
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
