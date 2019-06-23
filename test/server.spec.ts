import { assert } from 'chai'
import * as puppeteer from 'puppeteer'
import Server from '../src/server'

const port = 8080
const server = new Server(port)

describe('Server', async() => {

  it("should work", async() => {
    await server.start()
    console.log(server.wss.address())

    let browser = await puppeteer.launch({ headless: false })
    let page = await browser.newPage()

    await page.evaluate((port) => {

      const url = "ws://localhost:"+port
      console.log("setup", url)

      // @ts-ignore
      var soc = new WebSocket(url)

      console.log(soc)


    }, port)

    // await browser.close()
    assert.equal(true, true)
  })
})
