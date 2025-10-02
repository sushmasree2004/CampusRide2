import React, { useState } from 'react'
import api from '../api'
import { useNavigate } from 'react-router-dom'

export default function CreateRide(){
  const [form, setForm] = useState({source:'', destination:'', time:'', seats:1, fare:0})
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    try{
      // backend expects ride payload; ensure time is ISO string if needed
      await api.post('/rides', {...form, time: new Date(form.time).toISOString()})
      alert('Ride created')
      navigate('/')
    }catch(err){
      alert(err?.response?.data?.message || 'Creation failed')
    }
  }

  return (
    <div className="card">
      <h2>Offer a Ride</h2>
      <form onSubmit={submit} className="form">
        <label>Source<input value={form.source} onChange={e=>setForm({...form, source:e.target.value})} required/></label>
        <label>Destination<input value={form.destination} onChange={e=>setForm({...form, destination:e.target.value})} required/></label>
        <label>Time<input type="datetime-local" value={form.time} onChange={e=>setForm({...form, time:e.target.value})} required/></label>
        <label>Seats<input type="number" min="1" value={form.seats} onChange={e=>setForm({...form, seats:parseInt(e.target.value)})} required/></label>
        <label>Fare (optional)<input type="number" value={form.fare} onChange={e=>setForm({...form, fare:parseFloat(e.target.value) || 0})}/></label>
        <button className="btn" type="submit">Create</button>
      </form>
    </div>
  )
}
