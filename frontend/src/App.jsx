import React, { useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Login from './components/Login'
import RideFeed from './components/RideFeed'
import CreateRide from './components/CreateRide'
import RideDetails from './components/RideDetails'
import Profile from './components/Profile'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

export default function App(){
  const navigate = useNavigate()

  // handle redirect from backend OAuth callback: ?token=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token') || params.get('jwt')
    if(token){
      localStorage.setItem('campusride_token', token)
      // remove query param from URL
      window.history.replaceState({}, document.title, window.location.pathname)
      navigate('/')
    }
  }, [navigate])

  return (
    <>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<RideFeed />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create" element={<ProtectedRoute><CreateRide /></ProtectedRoute>} />
          <Route path="/ride/:id" element={<RideDetails />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </div>
    </>
  )
}
