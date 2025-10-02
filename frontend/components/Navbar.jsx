import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function Navbar(){
  const { user, logout } = useAuth() || {}
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="nav">
      <div className="nav-left">
        <Link to="/" className="brand">CampusRide VIT</Link>
      </div>
      <div className="nav-right">
        <Link to="/">Rides</Link>
        <Link to="/create">Offer Ride</Link>
        {user ? (
          <>
            <Link to="/profile">Profile</Link>
            <button className="link-btn" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  )
}
