import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'
import ChatRoom from './ChatRoom'

export default function RideDetails(){
  const { id } = useParams()
  const [ride, setRide] = useState(null)

  useEffect(()=> {
    api.get('/rides/' + id).then(r=> setRide(r.data)).catch(()=>{})
  }, [id])

  const book = async () => {
    try{
      await api.post(`/rides/${id}/book`)
      alert('Booked!')
      const res = await api.get('/rides/' + id); setRide(res.data)
    }catch(e){
      alert(e?.response?.data?.message || 'Booking failed')
    }
  }

  const cancel = async () => {
    try{
      // passenger cancel (endpoint assumed POST /rides/:id/cancel)
      await api.post(`/rides/${id}/cancel`)
      alert('Cancelled')
    }catch(e){
      alert(e?.response?.data?.message || 'Cancel failed')
    }
  }

  if(!ride) return <div>Loading...</div>
  return (
    <div>
      <h2>{ride.source} → {ride.destination}</h2>
      <div>When: {new Date(ride.time).toLocaleString()}</div>
      <div>Seats left: {ride.seats}</div>
      <div>Driver: {ride.driverName || ride.driver}</div>

      <div style={{marginTop:12}}>
        <button className="btn" onClick={book}>Book Seat</button>
        <button className="btn ghost" onClick={cancel} style={{marginLeft:8}}>Cancel</button>
      </div>

      <hr/>
      <ChatRoom rideId={id} />
    </div>
  )
}
