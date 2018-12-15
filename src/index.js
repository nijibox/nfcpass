import { ACK } from './usb'
import { arrayToHexString } from './utils'

export class DeviceLoader {
  static async connectDevice () {
    const filter = {
      vendorId: 0x054c,
    }
    try {
      const conf = {
        filters: [filter],
      }
      const device = await navigator.usb.requestDevice(conf)
      await device.open()
      await device.selectConfiguration(1)
      await device.claimInterface(0)
      return new NFCDevice(device)
    } catch (e) {
      throw e
    }
  }
}

class CardInfo {
  constructor (spec, idm, pmm) {
    this.spec = spec
    this.idm = idm
    this.pmm = pmm
  }
}

class NFCDevice {
  constructor (device) {
    this.device = device
  }

  async receive (len) {
    let data = await this.device.transferIn(1, len)
    console.debug(data)
    let arr = []
    for (let i = data.data.byteOffset; i < data.data.byteLength; i++) {
      arr.push(data.data.getUint8(i))
    }
    console.debug(arr)
    return arr
  }

  async send (data) {
    let uint8a = new Uint8Array(data)
    console.debug(uint8a)
    await this.device.transferOut(2, uint8a)
  }

  async sendCommand (cmd, params) {
    let command = [0x00, 0x00, 0xff, 0xff, 0xff]
    let data = [0xd6, cmd].concat(params)
    command = command.concat([data.length, 0, 256 - data.length])
    command = command.concat(data)
    let sum = 0
    for (let i = 0; i < data.length; i++) {
      sum += data[i]
    }
    let parity = (256 - sum) % 256 + 256
    command = command.concat([parity, 0])
    await this.send(command)
    await this.receive(6)
    const result = await this.receive(40)
    return result
  }

  async getType2TagInfo () {
    console.debug('SwitchRF')
    await this.sendCommand(0x06, [0x00])
    console.debug('InSetRF')
    await this.sendCommand(0x00, [0x02, 0x03, 0x0f, 0x03])
    console.debug('InSetProtocol')
    await this.sendCommand(0x02, [0x00, 0x18, 0x01, 0x01, 0x02, 0x01, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x06, 0x00, 0x07, 0x08, 0x08, 0x00, 0x09, 0x00, 0x0a, 0x00, 0x0b, 0x00, 0x0c, 0x00, 0x0e, 0x04, 0x0f, 0x00, 0x10, 0x00, 0x11, 0x00, 0x12, 0x00, 0x13, 0x06])
    await this.sendCommand(0x02, [0x01, 0x00, 0x02, 0x00, 0x05, 0x01, 0x00, 0x06, 0x07, 0x07])
    console.debug('InCommRF:SENS')
    await this.sendCommand(0x04, [0x36, 0x01, 0x26])
    console.debug('InCommRF:SDD')
    await this.sendCommand(0x02, [0x04, 0x01, 0x07, 0x08])
    await this.sendCommand(0x02, [0x01, 0x00, 0x02, 0x00])
    const ssdRes = await this.sendCommand(0x04, [0x36, 0x01, 0x93, 0x20])
    const result = arrayToHexString(ssdRes.slice(15, 19))
    return result === '00' ? null : new CardInfo('Type4', result, null)
  }

  async getType3TagInfo () {
    await this.sendCommand(0x2a, [0x01])
    console.debug('SwitchRF')
    await this.sendCommand(0x06, [0x00])
    console.debug('InSetRF')
    await this.sendCommand(0x00, [0x01, 0x01, 0x0f, 0x01])
    console.debug('InSetProtocol')
    await this.sendCommand(0x02, [0x00, 0x18, 0x01, 0x01, 0x02, 0x01, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x06, 0x00, 0x07, 0x08, 0x08, 0x00, 0x09, 0x00, 0x0a, 0x00, 0x0b, 0x00, 0x0c, 0x00, 0x0e, 0x04, 0x0f, 0x00, 0x10, 0x00, 0x11, 0x00, 0x12, 0x00, 0x13, 0x06])
    await this.sendCommand(0x02, [0x00, 0x18])
    console.debug('InCommRF:SENS')
    const data = await this.sendCommand(0x04, [0x6e, 0x00, 0x06, 0x00, 0xff, 0xff, 0x01, 0x00])
    return new CardInfo('Type3', arrayToHexString(data.slice(17, 25)), arrayToHexString(data.slice(25, 33)))
  }

  async readCardInfo () {
    await this.send(ACK)
    console.debug('GetProperty')
    await this.sendCommand(0x2a, [0x01])
    const type2 = await this.getType2TagInfo()
    if (type2 != null) {
      return type2
    }
    const type3 = await this.getType3TagInfo()
    if (type3 != null) {
      return type3
    }
    return null
  }

  async readIDm () {
    const card = await this.readCardInfo()
    if (card != null && card.idm != null) {
      return card.idm
    }
    return ''
  }
}
