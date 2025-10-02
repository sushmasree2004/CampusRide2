import React from 'react'

export default function Login(){
  const backend = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  const goGoogle = () => {
    // this opens the backend OAuth route; backend should redirect back to frontend root with ?token=JWT
    window.location.href = backend + '/auth/google'
  }

  return (
    <div className="card">
      <h2>Campus Ride - Login</h2>
      <p>Sign in with your VIT student Google account.</p>
      <button onClick={goGoogle} className="btn">Sign in with Google</button>
      <p style={{marginTop:12}}>Your backend should redirect to the frontend with `?token=JWT` on success.</p>
    </div>
  )
}
