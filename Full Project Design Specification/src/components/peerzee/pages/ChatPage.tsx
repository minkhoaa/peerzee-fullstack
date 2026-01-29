import { useState } from 'react';
import { VillageHeader } from '../VillageHeader';
import { SpeechBubble } from '../SpeechBubble';
import { PixelButton } from '../PixelButton';
import { CarvedInput } from '../CarvedInput';
import { Send, Image as ImageIcon, Smile, Paperclip } from 'lucide-react';

interface Message {
  id: number;
  sender: 'me' | 'them';
  text: string;
  timestamp: string;
}

interface Contact {
  id: number;
  name: string;
  avatar: string;
  online: boolean;
  lastMessage: string;
  unread?: number;
  level: number;
}

const mockContacts: Contact[] = [
  {
    id: 1,
    name: 'PixelPal_99',
    avatar: '👩',
    online: true,
    lastMessage: "Hey! 👋 Do you like retro games?",
    unread: 2,
    level: 3
  },
  {
    id: 2,
    name: 'Alex_Gamer',
    avatar: '👨',
    online: false,
    lastMessage: "Thanks for the chat!",
    level: 5
  },
  {
    id: 3,
    name: 'Luna_Moon',
    avatar: '👧',
    online: true,
    lastMessage: "Let's meet up soon!",
    level: 8
  }
];

const mockMessages: Message[] = [
  {
    id: 1,
    sender: 'them',
    text: "Hey! 👋 Do you like retro games?",
    timestamp: '10:02 AM'
  },
  {
    id: 2,
    sender: 'me',
    text: "Absolutely! Especially the RPGs. I grew up on Final Fantasy.",
    timestamp: '10:04 AM'
  },
  {
    id: 3,
    sender: 'them',
    text: "No way! FF6 is my all time favorite. What about you?",
    timestamp: '10:05 AM'
  }
];

export function ChatPage() {
  const [selectedContact, setSelectedContact] = useState(mockContacts[0]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(mockMessages);
  
  const handleSend = () => {
    if (!message.trim()) return;
    
    setMessages([...messages, {
      id: messages.length + 1,
      sender: 'me',
      text: message,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }]);
    setMessage('');
  };
  
  return (
    <div className="min-h-screen bg-[#D4E8F7] flex flex-col">
      {/* Header */}
      <div className="bg-parchment border-b-4 border-wood-dark px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-pink border-2 border-wood-dark flex items-center justify-center">
            <span className="text-xl">💌</span>
          </div>
          <div>
            <h1 className="font-pixel text-xl text-text-pixel">Peerzee</h1>
          </div>
        </div>
        <button className="pixel-btn pixel-btn-secondary px-4 py-2 font-pixel text-sm">
          MENU
        </button>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Contacts Sidebar */}
        <aside className="w-80 bg-parchment border-r-4 border-wood-dark overflow-y-auto">
          <div className="p-4 bg-parchment-dark border-b-2 border-wood-dark">
            <h2 className="font-pixel text-lg text-text-pixel mb-3">PIGEON MAIL</h2>
            <CarvedInput
              placeholder="Search messages..."
              className="text-sm"
            />
          </div>
          
          <div className="divide-y-2 divide-wood-dark/20">
            {mockContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full p-4 text-left transition-colors relative ${
                  selectedContact.id === contact.id
                    ? 'bg-primary-orange/20 border-l-4 border-primary-orange'
                    : 'hover:bg-parchment-dark'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-wood-dark border-3 border-border-dark flex items-center justify-center text-2xl">
                      {contact.avatar}
                    </div>
                    {contact.online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-landscape-green border-2 border-parchment rounded-full" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-pixel text-sm text-text-pixel truncate">{contact.name}</span>
                      <span className="text-xs text-text-pixel/50">
                        LVL {contact.level}
                      </span>
                      <div className="flex gap-0.5 ml-auto">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <span key={i} className={i < contact.level / 3 ? 'text-accent-pink' : 'text-text-pixel/20'}>
                            ♥
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-text-pixel/60 truncate">{contact.lastMessage}</p>
                  </div>
                  
                  {contact.unread && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-primary-red border-2 border-parchment rounded-full flex items-center justify-center">
                      <span className="font-pixel text-parchment text-xs">{contact.unread}</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </aside>
        
        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-white">
          {/* Chat Header */}
          <div className="bg-parchment border-b-4 border-wood-dark px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-wood-dark border-3 border-border-dark flex items-center justify-center text-2xl">
                  {selectedContact.avatar}
                </div>
                {selectedContact.online && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-landscape-green border-2 border-parchment rounded-full" />
                )}
              </div>
              <div>
                <h3 className="font-pixel text-lg text-text-pixel">{selectedContact.name}</h3>
                <p className="text-xs text-text-pixel/60">
                  LVL {selectedContact.level} • {selectedContact.online ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button className="w-10 h-10 bg-wood-dark border-2 border-border-dark flex items-center justify-center hover:bg-primary-orange transition-colors">
                <span className="text-parchment">📁</span>
              </button>
              <button className="w-10 h-10 bg-wood-dark border-2 border-border-dark flex items-center justify-center hover:bg-primary-orange transition-colors">
                <span className="text-parchment">⋯</span>
              </button>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Day Marker */}
            <div className="flex items-center justify-center mb-6">
              <div className="bg-parchment border-2 border-border-dark px-4 py-1">
                <span className="font-pixel text-sm text-text-pixel">QUEST DAY 1</span>
              </div>
            </div>
            
            {/* Cloud decorations */}
            <div className="absolute top-32 right-20 w-24 h-16 bg-[#E8F4FA] opacity-40" style={{ clipPath: 'polygon(0% 40%, 20% 40%, 20% 20%, 40% 20%, 40% 0%, 60% 0%, 60% 20%, 80% 20%, 80% 40%, 100% 40%, 100% 100%, 0% 100%)' }} />
            <div className="absolute bottom-32 left-20 w-32 h-20 bg-[#FFE5F0] opacity-30" style={{ clipPath: 'polygon(0% 50%, 25% 50%, 25% 25%, 50% 25%, 50% 0%, 75% 0%, 75% 25%, 100% 25%, 100% 100%, 0% 100%)' }} />
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'me' ? 'flex-row-reverse' : ''}`}>
                {msg.sender === 'them' && (
                  <div className="w-10 h-10 bg-wood-dark border-2 border-border-dark flex items-center justify-center flex-shrink-0 text-xl">
                    {selectedContact.avatar}
                  </div>
                )}
                
                <div className={`max-w-md ${msg.sender === 'me' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {msg.sender === 'them' && (
                    <span className="font-pixel text-xs text-text-pixel ml-2">{selectedContact.name}</span>
                  )}
                  
                  <SpeechBubble 
                    direction={msg.sender === 'them' ? 'left' : 'right'}
                    variant={msg.sender === 'me' ? 'dark' : 'light'}
                  >
                    <p className="text-sm">{msg.text}</p>
                  </SpeechBubble>
                  
                  <span className="text-xs text-text-pixel/50 px-2">{msg.timestamp}</span>
                </div>
                
                {msg.sender === 'me' && (
                  <div className="w-10 h-10 bg-accent-blue border-2 border-border-dark flex-shrink-0" />
                )}
              </div>
            ))}
            
            {/* Typing Indicator */}
            <div className="flex items-end gap-3">
              <div className="w-10 h-10 bg-wood-dark border-2 border-border-dark flex items-center justify-center text-xl">
                {selectedContact.avatar}
              </div>
              <SpeechBubble direction="left">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-text-pixel/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-text-pixel/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-text-pixel/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </SpeechBubble>
            </div>
          </div>
          
          {/* Input Area */}
          <div className="bg-parchment border-t-4 border-wood-dark p-4">
            <div className="flex items-end gap-3">
              <button className="w-10 h-10 bg-wood-dark border-2 border-border-dark flex items-center justify-center hover:bg-wood-light transition-colors flex-shrink-0">
                <Paperclip className="w-5 h-5 text-parchment" />
              </button>
              
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your reply..."
                  className="flex-1 carved-input"
                />
                <button className="w-10 h-10 bg-wood-dark border-2 border-border-dark flex items-center justify-center hover:bg-wood-light transition-colors">
                  <Smile className="w-5 h-5 text-parchment" />
                </button>
              </div>
              
              <button
                onClick={handleSend}
                className="pixel-btn pixel-btn-primary px-6 py-3 flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-center text-text-pixel/50 mt-2 font-mono">
              ⏎ PRESS ENTER TO ATTACK
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
