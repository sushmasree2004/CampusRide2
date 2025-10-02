import React, { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import api from '../api'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function ChatRoom({rideId}){
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const socketRef = useRef(null)

  useEffect(()=> {
    // load existing messages: backend route GET /chat/:rideId
    api.get(`/chat/${rideId}`).then(r=> setMessages(r.data)).catch(()=>{})
    const socket = io(SOCKET_URL, { auth: { token: localStorage.getItem('campusride_token') } })
    socketRef.current = socket

    socket.on('connect_error', (err) => {
      console.warn('Socket error:', err.message)
    })
    // join the ride-specific room
    socket.emit('joinRoom', rideId)
    socket.on('newMessage', msg => {
      // msg should match persisted chat message format
      setMessages(prev => [...prev, msg])
    })

    return ()=> {
      socket.emit('leaveRoom', rideId)
      socket.disconnect()
    }
  }, [rideId])

  const send = () => {
    if(!text) return
    // sendMessage should include rideId + text; backend should persist and emit newMessage
    socketRef.current.emit('sendMessage', { rideId, text })
    setText('')
  }

  return (
    <div className="chat">
      <h4>Ride Chat</h4>
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className="msg"><strong>{m.senderName || m.sender}:</strong> {m.text}</div>
        ))}
      </div>
      <div className="chat-input">
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Message..." />
        <button className="btn" onClick={send}>Send</button>
      </div>
    </div>
  )
}
