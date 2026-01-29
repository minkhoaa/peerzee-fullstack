import { Home, Search, User } from 'lucide-react';
import { ReactNode } from 'react';

interface VillageHeaderProps {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  onSearchClick?: () => void;
  userLevel?: number;
  userAvatar?: string;
  onUserClick?: () => void;
  rightContent?: ReactNode;
}

export function VillageHeader({
  title = 'PEERZEE VILLAGE',
  subtitle = 'EST. 2024 • POPULATION: 1,304',
  showSearch = false,
  onSearchClick,
  userLevel,
  userAvatar,
  onUserClick,
  rightContent
}: VillageHeaderProps) {
  return (
    <header className="bg-wood-dark border-b-4 border-wood-shadow px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary-orange border-3 border-border-dark flex items-center justify-center">
          <Home className="w-7 h-7 text-parchment" />
        </div>
        <div>
          <h1 className="font-pixel text-2xl text-parchment tracking-wider">{title}</h1>
          <p className="text-xs text-parchment-dark font-mono uppercase tracking-widest">{subtitle}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {showSearch && (
          <button
            onClick={onSearchClick}
            className="bg-wood-light border-3 border-border-dark px-4 py-2 flex items-center gap-2 hover:bg-wood-shadow transition-colors"
          >
            <Search className="w-5 h-5 text-parchment" />
            <span className="text-parchment-dark font-mono text-sm">Search notices...</span>
          </button>
        )}
        
        {rightContent}
        
        {userLevel !== undefined && (
          <div
            onClick={onUserClick}
            className="flex items-center gap-3 bg-wood-light border-3 border-border-dark px-4 py-2 cursor-pointer hover:bg-primary-orange transition-colors"
          >
            <span className="font-pixel text-parchment">
              Adventurer<br />
              <span className="text-accent-yellow">LVL {userLevel}</span>
            </span>
            {userAvatar ? (
              <img src={userAvatar} alt="User" className="w-10 h-10 border-2 border-parchment" />
            ) : (
              <div className="w-10 h-10 bg-accent-blue border-2 border-parchment flex items-center justify-center">
                <User className="w-6 h-6 text-parchment" />
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
