import { createSocket } from 'dgram'

const getMacBytes = (plainMacAddress: string) =>
  plainMacAddress.match(/(?<byte>[a-fA-F0-9]{2})/gm)?.map((byte) => parseInt(byte.toLowerCase(), 16))

export const wakeOnLan = async (mac: string, broadcast: string = '255.255.255.255', port = 9) => {
  const macBytes = getMacBytes(mac)

  if (!macBytes || macBytes.length !== 6) {
    throw new Error('Invalid MAC address')
  }

  const magicPacket = Buffer.alloc(102)
  magicPacket.fill(0xff, 0, 6)
  for (let i = 1; i <= 16; i++) {
    macBytes.forEach((byte, index) => {
      magicPacket.writeUInt8(byte, i * 6 + index)
    })
  }
  const client = createSocket('udp4')

  await new Promise<void>((resolve, reject) => {
    client.bind(() => {
      client.setBroadcast(true)

      client.send(magicPacket, 0, magicPacket.length, port, broadcast, (error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
        client.close()
      })
    })
  })
}
