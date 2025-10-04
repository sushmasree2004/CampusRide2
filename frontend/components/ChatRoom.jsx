import React, { useEffect, useState, useContext, useRef } from "react";
import api from "../src/api";
import socket from "../src/socket";
import { AuthContext } from "../src/auth/AuthProvider";

const ChatRoom = ({ rideId }) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const scrollRef = useRef(null);

  // Load chat history when component mounts or rideId changes
  useEffect(() => {
    if (!rideId) return;

    let mounted = true;
    (async () => {
      try {
        const res = await api.get(`/chat/${rideId}`);
        if (mounted && res.data.success) {
          setMessages(res.data.messages || []);
        }
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    })();

    return () => (mounted = false);
  }, [rideId]);

  // Setup socket: join room + listen for new messages
  useEffect(() => {
    if (!rideId) return;

    socket.emit("joinRide", rideId);

    const onReceive = (msg) => {
      // ensure consistent shape with history
      setMessages(prev => [...prev, msg]);
      // (optional) scroll to bottom
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
    };

    socket.on("receiveMessage", onReceive);

    return () => {
      socket.emit("leaveRide", rideId);
      socket.off("receiveMessage", onReceive);
    };
  }, [rideId]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

    const payload = {
      rideId,
      senderId: user?.id || user?._id,
      senderName: user?.name || user?.displayName || "Unknown",
      text: newMsg.trim(),
    };

    // emit; server saves and broadcasts
    socket.emit("sendMessage", payload);
    setNewMsg("");
  };

  return (
    <div className="chat-room" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="messages" style={{ overflowY: "auto", flex: 1, padding: 8 }}>
        {messages.map((m) => (
          <div key={m._id || m.id || Math.random()} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: "#555" }}>
              <strong>{m.senderName || (m.sender?.name ?? "Unknown")}</strong>{" "}
              <span style={{ marginLeft: 8, fontSize: 11 }}>{new Date(m.createdAt || m.timestamp || Date.now()).toLocaleTimeString()}</span>
            </div>
            <div>{m.message || m.text}</div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: "flex", padding: 8, borderTop: "1px solid #eee" }}>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          style={{ flex: 1, padding: "8px 10px" }}
        />
        <button type="submit" style={{ marginLeft: 8 }}>Send</button>
      </form>
    </div>
  );
};

export default ChatRoom;
