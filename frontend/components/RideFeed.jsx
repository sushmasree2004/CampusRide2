import React, { useEffect, useState } from 'react'
import api from '../api'
import { Link } from 'react-router-dom'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function RideFeed(){
  const [rides, setRides] = useState([])

  useEffect(()=> {
    // GET /rides (list available rides)
    api.get('/rides').then(r=> setRides(r.data)).catch(()=>{})
    // connect socket
    const socket = io(SOCKET_URL, { auth: { token: localStorage.getItem('campusride_token') } })

    socket.on('connect_error', (err) => {
      console.warn('Socket connect error', err.message)
    })
    // new ride broadcast
    socket.on('newRide', ride => {
      setRides(prev => [ride, ...prev])
    })
    // ride cancelled broadcast
    socket.on('rideCancelled', (payload) => {
      // payload could be { id: rideId } or full ride
      const id = payload?.id || payload?._id
      setRides(prev => prev.filter(r=> r._id !== id))
    })
    // rideBooked event: update seats if payload contains id + seats
    socket.on('rideBooked', (payload) => {
      const id = payload?.rideId || payload?._id
      const seats = payload?.seats
      if(!id) return
      setRides(prev => prev.map(r => r._id === id ? {...r, seats: seats ?? r.seats - 1} : r))
    })

    return ()=> socket.disconnect()
  }, [])

  const book = async (id) => {
    try{
      await api.post(`/rides/${id}/book`)
      alert('Booked — refresh to see seats if backend does not push update')
    }catch(e){
      alert(e?.response?.data?.message || 'Booking failed')
    }
  }

  return (
    <div>
      <h2>Available Rides</h2>
      {rides.length===0 && <p>No rides found.</p>}
      <ul className="ride-list">
        {rides.map(r => (
          <li key={r._id} className="ride-card">
            <div style={{flex:1}}>
              <div><strong>{r.source} → {r.destination}</strong></div>
              <div>When: {new Date(r.time).toLocaleString()}</div>
              <div>Seats left: {r.seats}</div>
              <div>Offered by: {r.driverName || r.driver}</div>
            </div>
            <div className="ride-actions">
              <Link to={`/ride/${r._id}`} className="btn-small">View</Link>
              <button className="btn-small" onClick={()=> book(r._id)}>Book Seat</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
