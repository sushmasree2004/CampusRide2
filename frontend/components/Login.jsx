import React, { useContext, useState } from "react";
import { AuthContext } from "../src/auth/AuthProvider";
import api from "../src/api";

const Login = () => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Handle normal email/password login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { email, password });

      if (res.data.success === false) {
        alert(res.data.message || "Login failed");
        return;
      }

      login(res.data.token, res.data.user);
    } catch (err) {
      console.error(err);
      alert("Login failed. Please check your credentials.");
    }
  };

  // Handle Google OAuth login
  const handleGoogleLogin = () => {
    window.open("http://localhost:5000/auth/google", "_self"); 
    // 👆 adjust backend URL if needed
  };

  return (
    <div className="login-container">
      <h2>Campus Ride Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email (@vitstudent.ac.in only)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Login</button>
      </form>

      <hr />

      <button onClick={handleGoogleLogin}>Login with Google</button>
    </div>
  );
};

export default Login;
