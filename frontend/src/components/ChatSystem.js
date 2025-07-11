import React, { useState, useEffect, useRef } from 'react';
import socket from '../socket';
import { FaPaperPlane, FaUserCircle, FaTimes, FaFile, FaImage } from 'react-icons/fa';
import { API_URL, ENDPOINTS } from '../config/api';
import './ChatSystem.css';

const ChatSystem = ({ taskId, otherUserId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chat, setChat] = useState(null);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Join user to their personal room
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.id) {
      socket.emit('join_user', user.id);
    }

    // Listen for incoming messages
    socket.on('new_message', (data) => {
      if (data.taskId === taskId) {
        setMessages(prev => [...prev, data.message]);
      }
    });

    // Load existing messages
    loadMessages();

    return () => {
      socket.off('new_message');
    };
  }, [taskId]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`${API_URL}${ENDPOINTS.CHAT_TASK(taskId)}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load chat');
      }
      
      const data = await response.json();
      setChat(data);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`${API_URL}${ENDPOINTS.CHAT_MESSAGE(taskId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          content: newMessage,
          messageType: 'text'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const messageData = await response.json();
      setMessages(prev => [...prev, messageData]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async () => {
    try {
      await fetch(`${API_URL}${ENDPOINTS.CHAT_READ(taskId)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    markAsRead();
  }, [messages]);

  if (loading) {
    return (
      <div className="chat-container">
        <div className="chat-loading">
          <div className="loading-spinner"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isOwnMessage = (message) => {
    const user = JSON.parse(localStorage.getItem('user'));
    return message.sender._id === user.id;
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-info">
          <h3>Task Chat</h3>
          {chat && (
            <span className="chat-participants">
              {chat.participants.length} participants
            </span>
          )}
        </div>
        <button className="chat-close-btn" onClick={onClose}>
          <FaTimes />
        </button>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={message._id || index} 
              className={`message ${isOwnMessage(message) ? 'sent' : 'received'}`}
            >
              <div className="message-avatar">
                {message.sender.profilePicture ? (
                  <img 
                    src={`${API_URL}${message.sender.profilePicture}`} 
                    alt={message.sender.name}
                  />
                ) : (
                  <FaUserCircle />
                )}
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-sender">{message.sender.name}</span>
                  <span className="message-time">{formatTime(message.createdAt)}</span>
                </div>
                <div className="message-body">
                  {message.messageType === 'file' ? (
                    <div className="file-message">
                      <FaFile />
                      <a href={`${API_URL}${message.fileUrl}`} target="_blank" rel="noopener noreferrer">
                        {message.fileName}
                      </a>
                      <span className="file-size">({(message.fileSize / 1024).toFixed(1)} KB)</span>
                    </div>
                  ) : message.messageType === 'image' ? (
                    <div className="image-message">
                      <img src={`${API_URL}${message.fileUrl}`} alt="Shared image" />
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
                {message.readBy && message.readBy.length > 0 && (
                  <div className="message-status">
                    <span className="read-indicator">✓ Read</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={sendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="chat-input"
          disabled={sending}
        />
        <button 
          type="submit" 
          className={`chat-send-btn ${sending ? 'sending' : ''}`}
          disabled={sending}
        >
          {sending ? (
            <div className="sending-spinner"></div>
          ) : (
            <FaPaperPlane />
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatSystem; 