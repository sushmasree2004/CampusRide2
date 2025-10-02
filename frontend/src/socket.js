import { io } from 'socket.io-client'
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function connectSocket(){
  const token = localStorage.getItem('campusride_token')
  // pass token in auth payload (backend should read socket.handshake.auth.token)
  return io(SOCKET_URL, { auth: { token } })
}
