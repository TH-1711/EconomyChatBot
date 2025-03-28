import React, { useState, useRef, useEffect } from "react";
import { SendOutlined } from "@ant-design/icons";
import ResponseLogo from "../components/responseLogo";
import UserLogo from "../components/userLogo";

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<
    { sender: "user" | "bot"; text: string }[]
  >([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (input.trim()) {
      // Add user's message
      setMessages((prev) => [...prev, { sender: "user", text: input }]);
      setInput("");

      // Simulate bot response after 1s delay
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "This is an automated response." },
        ]);
      }, 1000);
    }
  };

  return (
    <div
      className="chat-container"
      style={{
        backgroundColor: "#EAF2F8",
        height: "85vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Hide scrollbar globally except for the message area */}
      <style>
        {`
          /* Hide scrollbar for everything */
          * {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* Internet Explorer and Edge */
          }
          *::-webkit-scrollbar {
            display: none; /* WebKit browsers */
          }

          /* Show scrollbar only in the message area */
          .message-area {
            scrollbar-width: thin; /* Firefox */
            -ms-overflow-style: auto; /* IE and Edge */
          }
          .message-area::-webkit-scrollbar {
            display: block;
            width: 6px;
          }
          .message-area::-webkit-scrollbar-thumb {
            background: #bbb;
            border-radius: 3px;
          }
        `}
      </style>

      {/* Message Area */}
      <div
        className="message-area"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
            }}
          >
            {/* Bot avatar on left */}
            {msg.sender === "bot" && (
              <div style={{ marginRight: "8px" }}>
                <ResponseLogo />
              </div>
            )}
            <div
              style={{
                padding: "8px 16px",
                borderRadius: "16px",
                maxWidth: "60%",
                backgroundColor: msg.sender === "user" ? "#4A90E2" : "#CCCCCC",
                color: msg.sender === "user" ? "white" : "black",
                borderTopLeftRadius: msg.sender === "bot" ? "0" : "16px",
                borderTopRightRadius: msg.sender === "user" ? "0" : "16px",
              }}
            >
              {msg.text}
            </div>
            {/* User avatar on right */}
            {msg.sender === "user" && (
              <div style={{ marginLeft: "8px" }}>
                <UserLogo />
              </div>
            )}
          </div>
        ))}
        {/* Dummy div for auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: "8px",

          backgroundColor: "white",
          display: "flex",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Type message here"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            outline: "none",
          }}
        />
        <button
          onClick={handleSendMessage}
          style={{
            marginLeft: "8px",
            padding: "8px",
            backgroundColor: "#4A90E2",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          <SendOutlined />
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
