import { io } from 'socket.io-client'

const URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

class SocketService {
  constructor() {
    this.socket = null
    this.listeners = []
  }

  connect() {
    if (this.socket) return this.socket
    try {
      this.socket = io(URL, { transports: ['websocket', 'polling'] })
      this.socket.on('connect', () => this.emit('connected'))
      this.socket.on('connect_error', () => this.emit('error'))
      return this.socket
    } catch {
      return null
    }
  }

  on(event, handler) {
    this.listeners.push({ event, handler })
    if (this.socket) this.socket.on(event, handler)
    return () => this.off(event, handler)
  }

  off(event, handler) {
    this.listeners = this.listeners.filter((l) => !(l.event === event && l.handler === handler))
    if (this.socket) this.socket.off(event, handler)
  }

  emit(event, payload) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, payload)
    }
  }

  connected() {
    return !!(this.socket && this.socket.connected)
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }
}

export const socketService = new SocketService()
export default socketService