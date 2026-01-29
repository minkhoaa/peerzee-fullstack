import { useState } from 'react';

// Import all pages
import { LandingPage } from './components/peerzee/pages/LandingPage';
import { LoginPage } from './components/peerzee/pages/LoginPage';
import { RegisterPage } from './components/peerzee/pages/RegisterPage';
import { DiscoverPage } from './components/peerzee/pages/DiscoverPage';
import { SearchPage } from './components/peerzee/pages/SearchPage';
import { LikersPage } from './components/peerzee/pages/LikersPage';
import { MatchLobbyPage } from './components/peerzee/pages/MatchLobbyPage';
import { VideoDatingPage } from './components/peerzee/pages/VideoDatingPage';
import { CommunityPage } from './components/peerzee/pages/CommunityPage';
import { ChatPage } from './components/peerzee/pages/ChatPage';
import { MyProfilePage } from './components/peerzee/pages/MyProfilePage';
import { UserProfilePage } from './components/peerzee/pages/UserProfilePage';

type Page = 
  | 'landing'
  | 'login'
  | 'register'
  | 'discover'
  | 'search'
  | 'likers'
  | 'match-lobby'
  | 'video-dating'
  | 'community'
  | 'chat'
  | 'my-profile'
  | 'user-profile';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (email: string, password: string) => {
    console.log('Login:', email, password);
    setIsAuthenticated(true);
    setCurrentPage('community');
  };

  const handleRegister = (data: any) => {
    console.log('Register:', data);
    setIsAuthenticated(true);
    setCurrentPage('community');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('landing');
  };

  // Navigation helper
  const navigate = (page: Page) => {
    setCurrentPage(page);
  };

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return (
          <LandingPage
            onStart={() => navigate('register')}
            onLogin={() => navigate('login')}
          />
        );
      
      case 'login':
        return (
          <LoginPage
            onLogin={handleLogin}
            onRegister={() => navigate('register')}
            onBack={() => navigate('landing')}
          />
        );
      
      case 'register':
        return (
          <RegisterPage
            onRegister={handleRegister}
            onLogin={() => navigate('login')}
            onBack={() => navigate('landing')}
          />
        );
      
      case 'discover':
        return <DiscoverPage />;
      
      case 'search':
        return <SearchPage />;
      
      case 'likers':
        return <LikersPage />;
      
      case 'match-lobby':
        return <MatchLobbyPage />;
      
      case 'video-dating':
        return <VideoDatingPage />;
      
      case 'community':
        return <CommunityPage />;
      
      case 'chat':
        return <ChatPage />;
      
      case 'my-profile':
        return <MyProfilePage />;
      
      case 'user-profile':
        return <UserProfilePage />;
      
      default:
        return (
          <LandingPage
            onStart={() => navigate('register')}
            onLogin={() => navigate('login')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen">
      {renderPage()}
      
      {/* Debug Navigation Menu (for testing) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <details className="bg-wood-dark border-4 border-wood-shadow p-4 max-w-xs">
            <summary className="font-pixel text-parchment cursor-pointer mb-4">
              🗺️ DEV NAVIGATION
            </summary>
            
            <div className="space-y-2">
              <div className="border-b border-parchment/30 pb-2 mb-2">
                <p className="font-pixel text-xs text-parchment/70 mb-2">GROUP A: THE GATE</p>
                <button
                  onClick={() => navigate('landing')}
                  className="block w-full text-left px-2 py-1 text-xs text-parchment hover:bg-primary-orange"
                >
                  Landing
                </button>
                <button
                  onClick={() => navigate('login')}
                  className="block w-full text-left px-2 py-1 text-xs text-parchment hover:bg-primary-orange"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('register')}
                  className="block w-full text-left px-2 py-1 text-xs text-parchment hover:bg-primary-orange"
                >
                  Register
                </button>
              </div>
              
              <div className="border-b border-parchment/30 pb-2 mb-2">
                <p className="font-pixel text-xs text-parchment/70 mb-2">GROUP B: EXPLORATION</p>
                <button
                  onClick={() => navigate('discover')}
                  className="block w-full text-left px-2 py-1 text-xs text-parchment hover:bg-primary-orange"
                >
                  Discover
                </button>
                <button
                  onClick={() => navigate('search')}
                  className="block w-full text-left px-2 py-1 text-xs text-parchment hover:bg-primary-orange"
                >
                  Search
                </button>
                <button
                  onClick={() => navigate('likers')}
                  className="block w-full text-left px-2 py-1 text-xs text-parchment hover:bg-primary-orange"
                >
                  Likers
                </button>
              </div>
              
              <div className="border-b border-parchment/30 pb-2 mb-2">
                <p className="font-pixel text-xs text-parchment/70 mb-2">GROUP C: THE ARCADE</p>
                <button
                  onClick={() => navigate('match-lobby')}
                  className="block w-full text-left px-2 py-1 text-xs text-parchment hover:bg-primary-orange"
                >
                  Match Lobby
                </button>
                <button
                  onClick={() => navigate('video-dating')}
                  className="block w-full text-left px-2 py-1 text-xs text-parchment hover:bg-primary-orange"
                >
                  Video Dating
                </button>
              </div>
              
              <div className="border-b border-parchment/30 pb-2 mb-2">
                <p className="font-pixel text-xs text-parchment/70 mb-2">GROUP D: TOWN SQUARE</p>
                <button
                  onClick={() => navigate('community')}
                  className="block w-full text-left px-2 py-1 text-xs text-parchment hover:bg-primary-orange"
                >
                  Community
                </button>
                <button
                  onClick={() => navigate('chat')}
                  className="block w-full text-left px-2 py-1 text-xs text-parchment hover:bg-primary-orange"
                >
                  Chat
                </button>
              </div>
              
              <div className="pb-2">
                <p className="font-pixel text-xs text-parchment/70 mb-2">GROUP E: IDENTITY</p>
                <button
                  onClick={() => navigate('my-profile')}
                  className="block w-full text-left px-2 py-1 text-xs text-parchment hover:bg-primary-orange"
                >
                  My Profile
                </button>
                <button
                  onClick={() => navigate('user-profile')}
                  className="block w-full text-left px-2 py-1 text-xs text-parchment hover:bg-primary-orange"
                >
                  User Profile
                </button>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
