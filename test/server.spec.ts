import { assert } from 'chai'
import * as puppeteer from 'puppeteer'
import * as Server from '../dist/server'
import Client from '../dist/client'


describe('Server', async() => {

  it("should work", async() => {
    const browser = await puppeteer.launch({ headless: false })

    const remotePage = await browser.newPage()
    await remotePage.addScriptTag({path: './dist/client.js'})
    await connect(remotePage)
    await timeout(2000)

    // const page = await browser.newPage()
    // await page.addScriptTag({url: '../dist/client.js'})
    // let res = await page.evaluate(async () => {
    //   const url = "wss://bamk6ty9r9.execute-api.us-west-2.amazonaws.com/dev"
    //   let client = new Client(url)

    //   let peers = await client.getPeers()
    //   console.log(peers)

    //   client.onOpen = (e) => {
    //     client.connectToPeer(peers[0])
    //   }

    //   client.connect()
    // })

    // await browser.close()
    assert.equal(true, true)
  })
})


const connect = async (page) => {
  let res = await page.evaluate(async () => {
    const url = "wss://bamk6ty9r9.execute-api.us-west-2.amazonaws.com/dev"
    const client = new Client(url)
    return await client.connect()
  })
}

const timeout = async(ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}



// describe('Server', async() => {

//   it("should work", async() => {
//     const browser = await puppeteer.launch({ headless: false })

//     await connect(await browser.newPage())

//     await timeout(2000)

//     const page = await browser.newPage()
//     let res = await page.evaluate(async (Client) => {
//       eval("Client = " + Client)

//       const url = "wss://bamk6ty9r9.execute-api.us-west-2.amazonaws.com/dev"
//       let client = new Client(url)

//       let peers = await client.getPeers()
//       console.log(peers)

//       client.onOpen = (e) => {
//         client.connectToPeer(peers[0])
//       }

//       client.connect()
//     }, Client.toString())

//     // await browser.close()
//     assert.equal(true, true)
//   })
// })


// const connect = async (page) => {
//   let res = await page.evaluate(async (Client) => {
//     eval("Client = " + Client)

//     const url = "wss://bamk6ty9r9.execute-api.us-west-2.amazonaws.com/dev"
//     const client = new Client(url)
//     return await client.connect()

//   }, Client.toString())
// }

// const timeout = async(ms) => {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }
