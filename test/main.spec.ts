import { assert } from 'chai'
import * as puppeteer from 'puppeteer'


describe('YouTube-All: game_tag_from_videos_to_firehose', () => {

  it("should work", async() => {
    assert.equal(true, true)

    let browser = await puppeteer.launch({ headless: false })
    let localPage = await browser.newPage()
    let remotePage = await browser.newPage()

    await localPage.evaluate(() => {
      console.log("local")
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

      // // Set up the ICE candidates for the two peers TODO
      // localConnection.onicecandidate = onLocalIce

    })

    await remotePage.evaluate(() => {
      console.log("remote")
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

      // TODO
      // remoteConnection.onicecandidate = onRemoteIce
    })



    async function onLocalIce(e){
      console.log("onLocalIce", e)
      // await remotePage.evaluate(() => {
      //   e => !e.candidate
      //     || remoteConnection.addIceCandidate(e.candidate).catch(e => console.log(e))
      // })
    }

    async function onRemoteIce(e){
      console.log("onRemoteIce", e)
      // await remotePage.evaluate(() => {

      //   || localConnection.addIceCandidate(e.candidate)
      //   .catch(handleAddCandidateError);
      // })
    }



  })





  // // Now create an offer to connect; this starts the process

  // localConnection.createOffer()
  //   .then(offer => localConnection.setLocalDescription(offer))
  //   .then(() => remoteConnection.setRemoteDescription(localConnection.localDescription))
  //   .then(() => remoteConnection.createAnswer())
  //   .then(answer => remoteConnection.setLocalDescription(answer))
  //   .then(() => localConnection.setRemoteDescription(remoteConnection.localDescription))
  //   .catch(handleCreateDescriptionError);

})
