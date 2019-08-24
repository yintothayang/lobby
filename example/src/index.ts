import Client from '../../dist/client.js'

const url = "wss://bamk6ty9r9.execute-api.us-west-2.amazonaws.com/dev"
const client = new Client(url, true)
let pointer = {x: 0, y: 0}

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

  document.onmousemove = (event)=> {
    pointer.x = event.x
    pointer.y = event.y
  }

  client.addListener('on_dc_open', (peerId: string, e)=>{
    console.log("on_dc_open", e)
    setInterval(()=>{
      client.rtcSend(peerId, JSON.stringify(pointer))
    })
  })

  client.addListener('on_dc_message', (peerId: string, e)=>{
    console.log("on_dc_message", e)
    let square = document.getElementById(peerId)
    console.log("square", square)
    if(!square){
      square = document.createElement("div")
      square.className = "square"
      square.id = peerId
      document.body.appendChild(square)
    }

    let pointer = JSON.parse(e.data)
    square.style.left = pointer.x + "px"
    square.style.top = pointer.y + "px"

  })
}
