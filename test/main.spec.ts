import { assert } from 'chai'
import * as puppeteer from 'puppeteer'
import LudicServer from '../src/server'

const port = 3003
const server = new LudicServer(port)

describe('E2E', async() => {

  it("should work", async() => {
    server.start()

    let browser = await puppeteer.launch({ headless: false })
    let localPage = await browser.newPage()
    let remotePage = await browser.newPage()

    await setupLocal(localPage)
    await setupRemote(remotePage)

    assert.equal(true, true)
    // await browser.close()
  })


  // Now create an offer to connect; this starts the process

  // localConnection.createOffer()
  //   .then(offer => localConnection.setLocalDescription(offer))
  //   .then(() => remoteConnection.setRemoteDescription(localConnection.localDescription))
  //   .then(() => remoteConnection.createAnswer())
  //   .then(answer => remoteConnection.setLocalDescription(answer))
  //   .then(() => localConnection.setRemoteDescription(remoteConnection.localDescription))
  //   .catch(handleCreateDescriptionError);

})


async function setupLocal(page){
  await page.addScriptTag({ path: './node_modules/socket.io-client/dist/socket.io.js'})
  await page.evaluate((port) => {
    console.log("setupLocal")

    // @ts-ignore
    var socket = io('http://localhost:' + port);
    socket.on('connect', function(){console.log("local connected")})
    socket.on('event', function(data){ console.log("local event")})
    socket.on('disconnect', function(){})

    function onIceCandidate(e){
      console.log("onIceCandidate")
      socket.emit('localIceCandidate', e.candidate)
    }

      // Handle status changes on the local end of the data
      // channel; this is the end doing the sending of data
      // in this example.
      function handleSendChannelStatusChange(event) {
        if(sendChannel) {
          var state = sendChannel.readyState;
        }
      }

      // @ts-ignore
      let localConnection = new RTCPeerConnection()

      // Create the data channel and establish its event listeners
      let sendChannel = localConnection.createDataChannel("sendChannel")
      sendChannel.onopen = handleSendChannelStatusChange
      sendChannel.onclose = handleSendChannelStatusChange

      // Set up the ICE candidates for the two peers TODO
      localConnection.onicecandidate = onIceCandidate

      // Start
      localConnection.createOffer().then((offer) => {
        console.log("offer", offer)
        localConnection.setLocalDescription(offer)
        socket.emit('localDescription', offer);
      })
  }, port)
}


async function setupRemote(page){
  await page.addScriptTag({ path: './node_modules/socket.io-client/dist/socket.io.js'})
  await page.evaluate((port) => {
    console.log("setupRemote")
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

    // @ts-ignore
    var socket = io('http://localhost:' + port);
    socket.on('connect', function(){});
    socket.on('event', function(data){});
    socket.on('disconnect', function(){});


    // TODO
    // remoteConnection.onicecandidate = onRemoteIce


  }, port)
}
