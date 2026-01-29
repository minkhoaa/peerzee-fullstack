import { useState } from 'react';
import { VillageHeader } from '../VillageHeader';
import { PixelButton } from '../PixelButton';
import { CarvedInput } from '../CarvedInput';
import { Video, VideoOff, Mic, MicOff, PhoneOff, SkipForward, Volume2, VolumeX, Send, MoreVertical, Smile, Paperclip, Heart, Phone } from 'lucide-react';

export function VideoDatingPage() {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'Alex_Gamer27', text: 'Hey! 👋 Do you like retro games?', time: '14:32', isUser: false },
    { sender: 'You', text: 'Absolutely! Especially the RPGs. I grew up on Final Fantasy.', time: '14:33', isUser: true },
    { sender: 'Alex_Gamer27', text: 'No way! FF6 is my all time favorite. What about you?', time: '14:35', isUser: false },
  ]);
  const [isTyping, setIsTyping] = useState(true);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, { 
        sender: 'You', 
        text: message, 
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        isUser: true
      }]);
      setMessage('');
    }
  };
  
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <VillageHeader
        title="PEERZEE ARCADE"
        subtitle="VIDEO STATION • LIVE MATCH"
        userLevel={5}
      />
      
      <div className="flex-1 flex items-stretch p-6 gap-4">
        {/* LEFT SIDE - Video Area */}
        <div className="flex-1 flex flex-col">
          {/* Retro TV Frame */}
          <div className="bg-wood-dark border-8 border-wood-shadow p-6 flex-1 flex flex-col">
            {/* TV Screen Bezel */}
            <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border-4 border-black p-4 flex-1 flex flex-col">
              {/* Main Video Display */}
              <div className="flex-1 mb-4">
                {/* Partner's Video - Large */}
                <div className="relative h-full bg-gradient-to-br from-accent-blue/20 to-accent-blue/40 border-4 border-border-dark overflow-hidden crt-effect">
                  {/* Placeholder for actual video */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-blue-900/50">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-parchment/20 border-4 border-parchment/40 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-7xl">👤</span>
                      </div>
                      <p className="font-pixel text-3xl text-parchment">Alex_Gamer27</p>
                      <p className="text-parchment/70 text-lg mt-2">27 • Software Engineer</p>
                    </div>
                  </div>
                  
                  {/* Partner info overlay */}
                  <div className="absolute top-3 left-3 bg-black/70 border-2 border-parchment/50 px-3 py-1.5">
                    <p className="font-pixel text-sm text-parchment">PLAYER 2</p>
                  </div>
                  
                  {/* Audio indicator */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    {isSpeakerOn ? (
                      <div className="w-8 h-8 bg-landscape-green border-2 border-parchment flex items-center justify-center animate-pulse">
                        <Volume2 className="w-4 h-4 text-parchment" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-destructive border-2 border-parchment flex items-center justify-center">
                        <VolumeX className="w-4 h-4 text-parchment" />
                      </div>
                    )}
                  </div>
                  
                  {/* Your Video - Picture in Picture (bottom right) */}
                  <div className="absolute bottom-4 right-4 w-48 aspect-[4/3] bg-gradient-to-br from-landscape-green/20 to-landscape-green/40 border-3 border-border-dark overflow-hidden">
                    {isCameraOn ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-900/50 to-teal-900/50">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-parchment/20 border-2 border-parchment/40 rounded-full mx-auto mb-1 flex items-center justify-center">
                            <span className="text-2xl">📷</span>
                          </div>
                          <p className="font-pixel text-xs text-parchment">You</p>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-black">
                        <div className="text-center">
                          <VideoOff className="w-8 h-8 text-parchment/50 mx-auto mb-1" />
                          <p className="font-pixel text-xs text-parchment/70">CAM OFF</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Mic indicator */}
                    <div className="absolute top-2 right-2">
                      {isMicOn ? (
                        <div className="w-6 h-6 bg-landscape-green border border-parchment flex items-center justify-center">
                          <Mic className="w-3 h-3 text-parchment" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-destructive border border-parchment flex items-center justify-center">
                          <MicOff className="w-3 h-3 text-parchment" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Timer and Status Bar */}
              <div className="bg-black/80 border-3 border-parchment/50 p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary-red rounded-full animate-pulse" />
                    <span className="font-pixel text-parchment text-sm">LIVE</span>
                  </div>
                  
                  <div className="font-pixel text-2xl text-accent-yellow">
                    {formatTime(timeRemaining)}
                  </div>
                  
                  <div className="font-pixel text-parchment text-sm">
                    ROUND 1/∞
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="h-2 bg-wood-dark border border-parchment/30">
                  <div 
                    className="h-full bg-gradient-to-r from-landscape-green to-accent-yellow transition-all"
                    style={{ width: `${(timeRemaining / 180) * 100}%` }}
                  />
                </div>
              </div>
              
              {/* Controls */}
              <div className="grid grid-cols-5 gap-3">
                <button
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`pixel-btn p-4 flex flex-col items-center gap-2 ${
                    isMicOn ? 'bg-wood-dark text-parchment' : 'bg-destructive text-parchment'
                  }`}
                >
                  {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                  <span className="font-pixel text-xs">{isMicOn ? 'MUTE' : 'UNMUTE'}</span>
                </button>
                
                <button
                  onClick={() => setIsCameraOn(!isCameraOn)}
                  className={`pixel-btn p-4 flex flex-col items-center gap-2 ${
                    isCameraOn ? 'bg-wood-dark text-parchment' : 'bg-destructive text-parchment'
                  }`}
                >
                  {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                  <span className="font-pixel text-xs">{isCameraOn ? 'HIDE' : 'SHOW'}</span>
                </button>
                
                <button
                  className="pixel-btn bg-primary-red text-parchment p-4 flex flex-col items-center gap-2 col-span-1"
                >
                  <PhoneOff className="w-6 h-6" />
                  <span className="font-pixel text-xs">END</span>
                </button>
                
                <button
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`pixel-btn p-4 flex flex-col items-center gap-2 ${
                    isSpeakerOn ? 'bg-wood-dark text-parchment' : 'bg-wood-shadow text-parchment/50'
                  }`}
                >
                  {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                  <span className="font-pixel text-xs">SOUND</span>
                </button>
                
                <button className="pixel-btn pixel-btn-success p-4 flex flex-col items-center gap-2">
                  <SkipForward className="w-6 h-6" />
                  <span className="font-pixel text-xs">NEXT</span>
                </button>
              </div>
            </div>
            
            {/* TV Brand Label */}
            <div className="mt-4 text-center">
              <p className="font-pixel text-parchment text-sm">PEERZEE ARCADE™ VIDEO STATION</p>
              <p className="text-parchment/50 text-xs font-mono">MODEL: PZ-VD-2024</p>
            </div>
          </div>
        </div>
        
        {/* RIGHT SIDE - Chat Area */}
        <div className="w-96 flex flex-col">
          {/* Chat Frame */}
          <div className="bg-parchment border-4 border-wood-dark flex-1 flex flex-col">
            {/* Chat Header with User Info */}
            <div className="bg-parchment border-b-4 border-wood-dark p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 bg-accent-blue/40 border-3 border-wood-dark rounded-full flex items-center justify-center overflow-hidden">
                  <span className="text-2xl">👤</span>
                </div>
                {/* User Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-lg text-text-pixel">Alex_Gamer27</span>
                    <span className="text-primary-red">💖</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-text-pixel/70">
                    <span className="font-pixel">LVL 3</span>
                    <Heart className="w-3 h-3 fill-primary-red text-primary-red" />
                    <Heart className="w-3 h-3 fill-primary-red text-primary-red" />
                    <Heart className="w-3 h-3 fill-primary-red text-primary-red" />
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button className="pixel-btn bg-landscape-green text-parchment p-2 hover:bg-landscape-green/80">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="pixel-btn bg-accent-blue text-parchment p-2 hover:bg-accent-blue/80">
                  <Video className="w-4 h-4" />
                </button>
                <button className="pixel-btn bg-wood-dark text-parchment p-2">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 bg-parchment/95 p-4 overflow-y-auto">
              {/* Quest Day Divider */}
              <div className="flex items-center justify-center mb-4">
                <div className="bg-parchment border-2 border-wood-dark px-4 py-1">
                  <span className="font-pixel text-xs text-text-pixel/60">QUEST DAY 1</span>
                </div>
              </div>
              
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar - only show for other user */}
                    {!msg.isUser && (
                      <div className="w-10 h-10 bg-accent-blue/40 border-2 border-wood-dark rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">👤</span>
                      </div>
                    )}
                    
                    {/* Message Content */}
                    <div className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                      {/* Username and Time */}
                      {!msg.isUser && (
                        <div className="flex items-center gap-2 mb-1 ml-1">
                          <span className="font-pixel text-xs text-text-pixel/70">{msg.sender}</span>
                        </div>
                      )}
                      
                      {/* Speech Bubble */}
                      <div className={`relative max-w-[260px] px-4 py-3 border-3 border-wood-dark rounded-2xl ${
                        msg.isUser 
                          ? 'bg-parchment' 
                          : 'bg-white'
                      }`}>
                        <p className="text-sm text-text-pixel break-words">{msg.text}</p>
                      </div>
                      
                      {/* Timestamp */}
                      <span className="text-xs text-text-pixel/40 mt-1 mx-1">{msg.time}</span>
                    </div>
                    
                    {/* Empty space for alignment when it's user message */}
                    {msg.isUser && <div className="w-10" />}
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-accent-blue/40 border-2 border-wood-dark rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">👤</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="bg-white border-3 border-wood-dark rounded-2xl px-4 py-3 flex items-center gap-1">
                        <div className="w-2 h-2 bg-text-pixel/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-text-pixel/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-text-pixel/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Message Input Area */}
            <div className="bg-parchment border-t-4 border-wood-dark p-3">
              <div className="flex gap-2 mb-2">
                <button className="pixel-btn bg-wood-dark text-parchment p-2 flex-shrink-0">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your reply..."
                  className="flex-1 carved-input text-sm"
                />
                <button className="pixel-btn bg-wood-dark text-parchment p-2 flex-shrink-0">
                  <Smile className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleSendMessage}
                  className="pixel-btn bg-primary-red text-parchment p-2 px-4 flex items-center justify-center flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-center text-xs text-text-pixel/40 font-pixel">
                ↵ PRESS ENTER TO ATTACH
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Info */}
      <div className="px-6 pb-6">
        <div className="bg-parchment border-3 border-border-dark p-3 text-center">
          <p className="text-xs text-text-pixel/60">
            💡 Tip: Click "NEXT" to switch to another adventurer • Click "END" to return to lobby
          </p>
        </div>
      </div>
    </div>
  );
}