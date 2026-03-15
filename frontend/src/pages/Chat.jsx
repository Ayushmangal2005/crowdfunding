import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useSnackbar } from '../context/SnackbarContext';
import axios from 'axios';
import { 
  Send, 
  MessageCircle, 
  User, 
  Building,
  Search,
  MoreVertical
} from 'lucide-react';

const Chat = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { showError } = useSnackbar();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  
  useEffect(() => {
    fetchChats();
    
    // Auto-select chat if passed from campaign details
    if (location.state?.chatId) {
      fetchChatMessages(location.state.chatId);
    }
  }, [location.state]);

  useEffect(() => {
    if (socket) {
      socket.on('new-message', handleNewMessage);
      socket.on('user-typing', handleUserTyping);
      
      return () => {
        socket.off('new-message');
        socket.off('user-typing');
      };
    }
  }, [socket, activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChats = async () => {
    try {
      const response = await axios.get('/api/chat');
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
      showError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async (chatId) => {
    try {
      const response = await axios.get(`/api/chat/${chatId}/messages`);
      setActiveChat(response.data);
      setMessages(response.data.messages);
      
      // Join chat room
      if (socket) {
        socket.emit('join-chat', chatId);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      showError('Failed to load messages');
    }
  };

  const handleNewMessage = (data) => {
    console.log('Received new message:', data);
    
    if (data.chatId === activeChat?._id) {
      console.log('Message is for current chat, updating messages');
      // Check if message already exists to avoid duplicates
      setMessages(prev => {
        const messageExists = prev.some(msg => 
          msg.content === data.message.content && 
          msg.sender._id === data.message.sender._id &&
          Math.abs(new Date(msg.timestamp) - new Date(data.message.timestamp)) < 1000 // Within 1 second
        );
        
        if (messageExists) {
          console.log('Message already exists, skipping');
          return prev;
        }
        
        console.log('Adding new message to state');
        return [...prev, data.message];
      });
    }
    
    // Update chat list
    setChats(prev => prev.map(chat => 
      chat._id === data.chatId 
        ? { ...chat, lastMessage: new Date(), messages: [...chat.messages, data.message] }
        : chat
    ));
  };

  const handleUserTyping = (data) => {
    if (data.userId !== user._id) {
      setTypingUsers(prev => ({
        ...prev,
        [data.userId]: data.isTyping
      }));
      
      // Clear typing indicator after 3 seconds
      setTimeout(() => {
        setTypingUsers(prev => ({
          ...prev,
          [data.userId]: false
        }));
      }, 3000);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeChat || sending) return;
    
    console.log('Sending message:', newMessage.trim());
    setSending(true);
    
    try {
      // Create the message object immediately
      const messageToSend = {
        sender: {
          _id: user._id,
          name: user.name
        },
        content: newMessage.trim(),
        timestamp: new Date()
      };

      console.log('Message object created:', messageToSend);

      // Update local state immediately for instant feedback
      setMessages(prev => [...prev, messageToSend]);
      setNewMessage('');

      // Update chat list with new message
      setChats(prev => prev.map(chat => 
        chat._id === activeChat._id 
          ? { 
              ...chat, 
              lastMessage: new Date(),
              messages: [...chat.messages, messageToSend]
            }
          : chat
      ));

      // Send via socket
      if (socket) {
        console.log('Emitting send-message via socket');
        socket.emit('send-message', {
          chatId: activeChat._id,
          content: messageToSend.content
        });
      } else {
        console.log('Socket not available');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (isTyping) => {
    if (socket && activeChat) {
      socket.emit('typing', {
        chatId: activeChat._id,
        isTyping
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOtherParticipant = (chat) => {
    return chat.participants.find(p => p._id !== user._id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden h-[calc(100vh-8rem)]">
          <div className="flex h-full">
            {/* Chat List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {chats.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                    <p className="text-gray-500">Start a conversation by visiting a campaign and clicking "Start Chat"</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {chats.map((chat) => {
                      const otherParticipant = getOtherParticipant(chat);
                      const lastMessage = chat.messages[chat.messages.length - 1];
                      
                      return (
                        <button
                          key={chat._id}
                          onClick={() => fetchChatMessages(chat._id)}
                          className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                            activeChat?._id === chat._id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              {otherParticipant.role === 'startup' ? (
                                <Building className="h-5 w-5 text-blue-600" />
                              ) : (
                                <User className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {otherParticipant.name}
                                </p>
                                <span className="text-xs text-gray-500">
                                  {formatTime(chat.lastMessage)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-500 truncate">
                                  {otherParticipant.company || otherParticipant.role}
                                </p>
                                {chat.campaign && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {chat.campaign.title.length > 15 
                                      ? chat.campaign.title.substring(0, 15) + '...'
                                      : chat.campaign.title
                                    }
                                  </span>
                                )}
                              </div>
                              {lastMessage && (
                                <p className="text-xs text-gray-400 truncate mt-1">
                                  {lastMessage.content}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {activeChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-6 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {getOtherParticipant(activeChat).role === 'startup' ? (
                            <Building className="h-5 w-5 text-blue-600" />
                          ) : (
                            <User className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {getOtherParticipant(activeChat).name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {getOtherParticipant(activeChat).company || getOtherParticipant(activeChat).role}
                          </p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                    {activeChat.campaign && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          Regarding: <span className="font-medium">{activeChat.campaign.title}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((message, index) => {
                      const isCurrentUser = message.sender._id === user._id;
                      const showDateSeparator = index === 0 || 
                        formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);
                      
                      return (
                        <div key={index}>
                          {showDateSeparator && (
                            <div className="text-center my-4">
                              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded">
                                {formatDate(message.timestamp)}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isCurrentUser 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {formatTime(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Typing indicator */}
                    {Object.values(typingUsers).some(isTyping => isTyping) && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-6 border-t border-gray-200 bg-white">
                    <form onSubmit={sendMessage} className="flex space-x-4">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onFocus={() => handleTyping(true)}
                        onBlur={() => handleTyping(false)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;