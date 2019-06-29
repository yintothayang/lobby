import { assert } from 'chai'
import * as puppeteer from 'puppeteer'
import Server from '../src/server'
import Client from '../src/client'

const port = 5555
const url = "ws://localhost:" + port
const server = new Server(port)

describe('Server', async() => {

  it("should work", async() => {
    await server.start()

    const browser = await puppeteer.launch({ headless: false })
    const page = await browser.newPage()

    let res = await page.evaluate((Client) => {
      eval("Client = " + Client)

      const url = "ws://localhost:5555"
      let client = new Client(url)

      client.start()

    }, Client.toString())

    await browser.close()
    assert.equal(true, true)
  })
})
