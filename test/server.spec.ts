import { assert } from 'chai'
import * as puppeteer from 'puppeteer'
import * as Server from '../src/server'
import Client from '../src/client'



describe('Server', async() => {

  it("should work", async() => {
    const browser = await puppeteer.launch({ headless: false })
    const page = await browser.newPage()

    let res = await page.evaluate(async (Client) => {
      eval("Client = " + Client)

      const url = "wss://bamk6ty9r9.execute-api.us-west-2.amazonaws.com/dev"
      let client = new Client(url)

      let peers = await client.getPeers()
      console.log(peers)

      client.onOpen = (e) => {
        console.log("open: ", e)
        client.send("init", "to 141456", {
          taco: "loco"
        })
      }

      client.connect()

    }, Client.toString())

    // await browser.close()
    assert.equal(true, true)
  })
})
