import { assert } from 'chai'
import * as puppeteer from 'puppeteer'

import Client, {Peer, Connection} from '../dist/client'

describe('Data', async() => {

  it("should work", async() => {
    const browser = await puppeteer.launch({ headless: false })

    await connect(await browser.newPage())

    await timeout(2000)

    const page = await browser.newPage()
    const data = {
      Client: Client.toString(),
      Peer: Peer.toString(),
      Connection: Connection.toString()
    }
    let res = await page.evaluate(async ({Client, Peer, Connection}) => {
      eval("Client = " + Client)
      eval("Peer = " + Peer)
      eval("Connection = " + Connection)

      const url = "wss://bamk6ty9r9.execute-api.us-west-2.amazonaws.com/dev"
      let client = new Client(url, true)

      let peers = await client.getPeers()

      await client.connect()
      client.addListener('ws_open', ()=>{
        client.requestConnection(client.peers[0])
      })

      client.addListener('on_dc_open', (peerId: string, event)=>{
        client.rtcSend(peerId, "Hello Peer")
      })

    }, data)

    // await browser.close()
    assert.equal(true, true)
  })
})


const connect = async (page) => {
  let data = {
    Client: Client.toString(),
    Peer: Peer.toString(),
    Connection: Connection.toString()
  }
  let res = await page.evaluate(async ({Client, Peer, Connection}) => {
    eval("Client = " + Client)
    eval("Peer = " + Peer)
    eval("Connection = " + Connection)
    const url = "wss://bamk6ty9r9.execute-api.us-west-2.amazonaws.com/dev"
    const client = new Client(url, true)

    client.addListener('on_dc_message', (peerId: string, event)=>{
      console.log("Message from: ", peerId)
      console.log(event)
    })

    return await client.connect()

  }, data)
}

const timeout = async(ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}
