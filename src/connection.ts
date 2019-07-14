export default class Connection {
  to: string
  isHost: boolean
  pc: any
  dc: any

  constructor(to: string, isHost: boolean=false){
    this.to = to
    this.isHost = isHost

    // @ts-ignore
    this.pc = new RTCPeerConnection()
    this.pc.ondatachannel = this.ondatachannel.bind(this)

    this.dc = this.pc.createDataChannel(this.to)
    this.dc.onopen = this.onopen.bind(this)
    this.dc.onclose = this.onclose.bind(this)

    this.pc.onicecandidate = this.onicecandidate.bind(this)

  }

  // pc events
  ondatachannel(e){
    console.log("ondatachannel(): to", this.to)

    // TODO, if not isHost?
    this.dc = e.channel
    this.dc.onopen = this.onopen.bind(this)
    this.dc.onclose = this.onclose.bind(this)
    this.dc.onmessage = this.onmessage.bind(this)
  }

  onicecandidate(e){
    // TODO send to Peer
    // localConnection.onicecandidate = e => !e.candidate
    //   || remoteConnection.addIceCandidate(e.candidate)
    //   .catch(handleAddCandidateError);
  }

  // dc events
  onopen(e){
    console.log("onopen(): to", this.to)
  }

  onclose(e){
    console.log("onclose(): to", this.to)
  }

  onmessage(e){
    console.log("onmessage(): to", this.to)
  }

  send(data: any){
    this.dc.send(data)
  }

  async close(){
    await this.dc.close()
    await this.pc.close()

    this.dc = null
    this.pc = null
  }


  async addIceCandidate(candidate){
    console.log("addIceCandidate(): to", this.to)
    return await this.pc.addIceCandidate(candidate)
  }

  async createOffer(){
    console.log("createOffer(): to", this.to)
    return await this.pc.createOffer()
  }

  async setLocalDescription(desc){
    console.log("setLocalDescription(): to", this.to)
    return await this.pc.setLocalDescription(desc)
  }

  async setRemoteDescription(desc){
    console.log("setRemoteDescription(): to", this.to)
    return await this.pc.setRemoteDescription(desc)
  }

  async createAnswer(){
    console.log("createAnswer(): to", this.to)
    return await this.pc.createAnswer()
  }

}
