import { assert } from 'chai'
import * as puppeteer from 'puppeteer'

import Client, {Peer, Connection} from '../dist/client'

describe('Server', async() => {

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
      let client = new Client(url)

      let peers = await client.getPeers()
      console.log(peers)

      client.onOpen = (e) => {
        client.connectToPeer(peers[0])
      }

      client.connect()
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
    const client = new Client(url)
    return await client.connect()

  }, data)
}

const timeout = async(ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}
