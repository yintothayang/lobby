import { assert } from 'chai'
import * as puppeteer from 'puppeteer'
import Server from '../src/server'
import Client from '../src/client'

const port = 5555
const url = "ws://localhost:" + port
const server = new Server(port)

describe('E2E', async() => {

  it("should work", async() => {
    await server.start()

    let browser = await puppeteer.launch({ headless: false })
    let localPage = await browser.newPage()
    let remotePage = await browser.newPage()

    await initWS(localPage)
    await initWS(remotePage)

    // await new Promise(resolve => setTimeout(resolve, 1000))

    // await setupRemote(remotePage)
    // await setupLocal(localPage)

    // await browser.close()
  })

  // localConnection.createOffer()
  //   .then(offer => localConnection.setLocalDescription(offer))
  //   .then(() => remoteConnection.setRemoteDescription(localConnection.localDescription))
  //   .then(() => remoteConnection.createAnswer())
  //   .then(answer => remoteConnection.setLocalDescription(answer))
  //   .then(() => localConnection.setRemoteDescription(remoteConnection.localDescription))
  //   .catch(handleCreateDescriptionError);

})

async function initWS(page){
  return await page.evaluate(async (Client) => {
    console.log("initWS")
    eval("Client = " + Client)

    const url = "ws://localhost:5555"
    const client = new Client(url)

    await client.start()
  }, Client.toString())
}


// LOCAL
async function setupLocal(page){
  await page.evaluate((Client) => {
    console.log("setupLocal")
    eval("Client = " + Client)

    const url = "ws://localhost:5555"
    const client = new Client(url)

    let localConnection
    let sendChannel

    client.addIceCandidate = (data) => {
      localConnection.addIceCandidate(data)
    }

    // Start
    client.onReady = () => {

      // @ts-ignore
      localConnection = new RTCPeerConnection()

      localConnection.onicecandidate = (e) => {
        if(e.candidate) client.send('setRemoteDescription', 'all', e.candidate)
      }

      // Create the data channel and establish its event listeners
      sendChannel = localConnection.createDataChannel("sendChannel")
      sendChannel.onopen = (e) => { console.log("sendChannel.onopen", e)}
      sendChannel.onclose = (e) => { console.log("sendChannel.onclose", e)}

      localConnection.createOffer().then((offer) => {
        localConnection.setLocalDescription(offer)
        client.send('setRemoteDescription', 'all', localConnection.localDescription)
      })
    }

    client.start()

  }, Client.toString())
}


// REMOTE
async function setupRemote(page){
  await page.evaluate((Client) => {
    console.log("setupRemote")
    eval("Client = " + Client)

    const url = "ws://localhost:5555"
    let client = new Client(url)

    client.start()

    var receiveChannel = null

    function handleReceiveMessage(event) {
      console.log("handleReceiveMessage: ", event)
    }

    // Handle status changes on the receiver's channel.
    function handleReceiveChannelStatusChange(event) {
      if (receiveChannel) {
        console.log("Receive channel's status has changed to " +  receiveChannel.readyState);
      }
    }

    // Called when the connection opens and the data
    // channel is ready to be connected to the remote.
    function receiveChannelCallback(event) {
      receiveChannel = event.channel;
      receiveChannel.onmessage = handleReceiveMessage;
      receiveChannel.onopen = handleReceiveChannelStatusChange;
      receiveChannel.onclose = handleReceiveChannelStatusChange;
    }

    // Create the remote connection and its event listeners
    // @ts-ignore
    let remoteConnection = new RTCPeerConnection()
    remoteConnection.ondatachannel = receiveChannelCallback;


    client.setRemoteDescription = (data) => {
      remoteConnection.setRemoteDescription(data)
    }

    client.addIceCandidate = (data) => {
      remoteConnection.addIceCandidate(data)
    }

    remoteConnection.onicecandidate = (e) => {
      if(e.candidate) client.send('setRemoteDescription', 'all', e.candidate)
    }

  }, Client.toString())
}
