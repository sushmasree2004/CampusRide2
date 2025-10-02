import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Profile(){
  const [profile, setProfile] = useState(null)
  useEffect(()=> {
    // GET /users/me is expected
    api.get('/users/me').then(r=> setProfile(r.data)).catch(()=>{})
  }, [])
  if(!profile) return <div>Loading...</div>
  return (
    <div>
      <h2>{profile.name}</h2>
      <p>{profile.email}</p>
      <h3>Your offered rides</h3>
      <ul>
        {profile.offeredRides?.map(r=> <li key={r._id}>{r.source} → {r.destination} ({new Date(r.time).toLocaleString()})</li>)}
      </ul>
      <h3>Your bookings</h3>
      <ul>
        {profile.bookings?.map(b=> <li key={b._id}>{b.source} → {b.destination} ({new Date(b.time).toLocaleString()})</li>)}
      </ul>
    </div>
  )
}
