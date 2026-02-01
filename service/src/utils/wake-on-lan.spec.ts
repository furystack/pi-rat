import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dgram before importing the module
const mockSend = vi.fn()
const mockClose = vi.fn()
const mockSetBroadcast = vi.fn()
const mockBind = vi.fn()

const mockSocket = {
  send: mockSend,
  close: mockClose,
  setBroadcast: mockSetBroadcast,
  bind: mockBind,
}

vi.mock('dgram', () => ({
  createSocket: vi.fn(() => mockSocket),
}))

// Import after mocking
import { wakeOnLan } from './wake-on-lan.js'

describe('wakeOnLan', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default successful behavior
    mockBind.mockImplementation((callback: () => void) => {
      callback()
    })
    mockSend.mockImplementation(
      (
        _packet: Buffer,
        _offset: number,
        _length: number,
        _port: number,
        _broadcast: string,
        callback: (error: Error | null) => void,
      ) => {
        callback(null)
      },
    )
  })

  describe('MAC address validation', () => {
    it('should throw error for invalid MAC address format', async () => {
      await expect(wakeOnLan('invalid')).rejects.toThrow('Invalid MAC address')
    })

    it('should throw error for MAC address that is too short', async () => {
      await expect(wakeOnLan('AA:BB:CC:DD:EE')).rejects.toThrow('Invalid MAC address')
    })

    it('should accept MAC address with extra invalid characters at the end', async () => {
      // The regex only matches valid hex pairs, so 'AA:BB:CC:DD:EE:FF:GG' still yields 6 valid bytes
      // since 'GG' is not a valid hex pair and won't be matched
      await wakeOnLan('AA:BB:CC:DD:EE:FF:GG')
      expect(mockSend).toHaveBeenCalled()
    })

    it('should throw error for empty string', async () => {
      await expect(wakeOnLan('')).rejects.toThrow('Invalid MAC address')
    })

    it('should throw error for MAC with invalid characters', async () => {
      await expect(wakeOnLan('GG:HH:II:JJ:KK:LL')).rejects.toThrow('Invalid MAC address')
    })
  })

  describe('valid MAC address formats', () => {
    it('should accept MAC address with colons', async () => {
      await wakeOnLan('AA:BB:CC:DD:EE:FF')
      expect(mockSend).toHaveBeenCalled()
    })

    it('should accept MAC address with dashes', async () => {
      await wakeOnLan('AA-BB-CC-DD-EE-FF')
      expect(mockSend).toHaveBeenCalled()
    })

    it('should accept MAC address without separators', async () => {
      await wakeOnLan('AABBCCDDEEFF')
      expect(mockSend).toHaveBeenCalled()
    })

    it('should accept lowercase MAC address', async () => {
      await wakeOnLan('aa:bb:cc:dd:ee:ff')
      expect(mockSend).toHaveBeenCalled()
    })

    it('should accept mixed case MAC address', async () => {
      await wakeOnLan('Aa:Bb:Cc:Dd:Ee:Ff')
      expect(mockSend).toHaveBeenCalled()
    })
  })

  describe('magic packet', () => {
    it('should send a 102-byte magic packet', async () => {
      await wakeOnLan('AA:BB:CC:DD:EE:FF')

      const sendCall = mockSend.mock.calls[0]
      const packet = sendCall[0] as Buffer
      const offset = sendCall[1] as number
      const length = sendCall[2] as number

      expect(offset).toBe(0)
      expect(length).toBe(102)
      expect(packet.length).toBe(102)
    })

    it('should start with 6 bytes of 0xFF', async () => {
      await wakeOnLan('AA:BB:CC:DD:EE:FF')

      const sendCall = mockSend.mock.calls[0]
      const packet = sendCall[0] as Buffer

      for (let i = 0; i < 6; i++) {
        expect(packet[i]).toBe(0xff)
      }
    })

    it('should repeat MAC address 16 times', async () => {
      await wakeOnLan('AA:BB:CC:DD:EE:FF')

      const sendCall = mockSend.mock.calls[0]
      const packet = sendCall[0] as Buffer

      // MAC bytes: AA=170, BB=187, CC=204, DD=221, EE=238, FF=255
      const expectedMacBytes = [0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff]

      // Check all 16 repetitions of MAC address after the 6-byte header
      for (let i = 0; i < 16; i++) {
        for (let j = 0; j < 6; j++) {
          expect(packet[6 + i * 6 + j]).toBe(expectedMacBytes[j])
        }
      }
    })
  })

  describe('network configuration', () => {
    it('should use default broadcast address 255.255.255.255', async () => {
      await wakeOnLan('AA:BB:CC:DD:EE:FF')

      const sendCall = mockSend.mock.calls[0]
      const broadcast = sendCall[4] as string

      expect(broadcast).toBe('255.255.255.255')
    })

    it('should use default port 9', async () => {
      await wakeOnLan('AA:BB:CC:DD:EE:FF')

      const sendCall = mockSend.mock.calls[0]
      const port = sendCall[3] as number

      expect(port).toBe(9)
    })

    it('should use custom broadcast address when provided', async () => {
      await wakeOnLan('AA:BB:CC:DD:EE:FF', '192.168.1.255')

      const sendCall = mockSend.mock.calls[0]
      const broadcast = sendCall[4] as string

      expect(broadcast).toBe('192.168.1.255')
    })

    it('should use custom port when provided', async () => {
      await wakeOnLan('AA:BB:CC:DD:EE:FF', '255.255.255.255', 7)

      const sendCall = mockSend.mock.calls[0]
      const port = sendCall[3] as number

      expect(port).toBe(7)
    })

    it('should enable broadcast mode on socket', async () => {
      await wakeOnLan('AA:BB:CC:DD:EE:FF')

      expect(mockSetBroadcast).toHaveBeenCalledWith(true)
    })

    it('should close socket after sending', async () => {
      await wakeOnLan('AA:BB:CC:DD:EE:FF')

      expect(mockClose).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should reject when send fails', async () => {
      const sendError = new Error('Send failed')
      mockSend.mockImplementation(
        (
          _packet: Buffer,
          _offset: number,
          _length: number,
          _port: number,
          _broadcast: string,
          callback: (error: Error | null) => void,
        ) => {
          callback(sendError)
        },
      )

      await expect(wakeOnLan('AA:BB:CC:DD:EE:FF')).rejects.toThrow('Send failed')
    })

    it('should close socket even when send fails', async () => {
      const sendError = new Error('Send failed')
      mockSend.mockImplementation(
        (
          _packet: Buffer,
          _offset: number,
          _length: number,
          _port: number,
          _broadcast: string,
          callback: (error: Error | null) => void,
        ) => {
          callback(sendError)
        },
      )

      await expect(wakeOnLan('AA:BB:CC:DD:EE:FF')).rejects.toThrow()
      expect(mockClose).toHaveBeenCalled()
    })
  })
})
