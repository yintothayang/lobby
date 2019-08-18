import Client from '../../dist/client.js'

const url = "wss://bamk6ty9r9.execute-api.us-west-2.amazonaws.com/dev"
const client = new Client(url, true)

const connectToPeer = (id: string, event: any)=>{
  console.log("connecting to:  ", id)
  console.log("this: ", event)
  client.requestConnection(id)
}

const connectToLobby = async()=>{
  console.log("connecting to loby")
  await client.connect()
}

const createPeerListItem = (id: string)=>{
  let list_item_el = document.createElement("div")
  list_item_el.className = "item"

  // Text Id
  let id_el = document.createTextNode(id)
  list_item_el.appendChild(id_el)

  // Connect button
  let button = document.createElement("input")
  button.type = "button"
  button.value = "connect"
  button.onclick = connectToPeer.bind(this, id)
  list_item_el.appendChild(button)

  let list = document.getElementById("peerList")
  list.append(list_item_el)
}


window.onload = async() => {
  // Connect button
  let button = document.createElement("input")
  button.type = "button"
  button.value = "connect to lobby"
  button.onclick = connectToLobby
  document.body.appendChild(button)


  client.addListener('ws_open', async(e)=>{
    console.log("ws opened", e)


    setInterval(async()=>{
      let peers = await client.getPeers()
      const list = document.getElementById("peerList")
      while (list.firstChild) {
        list.removeChild(list.firstChild)
      }
      peers.forEach(peer => {
        createPeerListItem(peer.id)
      })
    }, 500)
  })

}
