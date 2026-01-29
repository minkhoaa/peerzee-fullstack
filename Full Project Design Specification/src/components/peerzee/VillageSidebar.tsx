import { Home, Map, Mail, MessageSquare, MapPin, Video, Users, User, Settings } from 'lucide-react';
import { SignPlank } from './SignPlank';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface VillageSidebarProps {
  activeItem?: string;
  onItemClick?: (id: string) => void;
}

const sidebarItems: SidebarItem[] = [
  { id: 'home', label: 'MY HOMESTEAD', icon: <Home className="w-5 h-5" /> },
  { id: 'map', label: 'VILLAGE MAP', icon: <Map className="w-5 h-5" /> },
  { id: 'mailbox', label: 'MAILBOX', icon: <Mail className="w-5 h-5" />, badge: 3 },
  { id: 'settings', label: 'SETTINGS', icon: <Settings className="w-5 h-5" /> },
];

export function VillageSidebar({ activeItem = 'map', onItemClick }: VillageSidebarProps) {
  return (
    <aside className="w-64 bg-landscape-green-dark p-4 flex flex-col gap-3 border-r-4 border-wood-shadow">
      {sidebarItems.map((item) => (
        <div key={item.id} className="relative">
          <SignPlank
            active={activeItem === item.id}
            onClick={() => onItemClick?.(item.id)}
            icon={item.icon}
          >
            {item.label}
          </SignPlank>
          {item.badge && (
            <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary-red border-2 border-parchment rounded-full flex items-center justify-center font-pixel text-parchment text-sm shadow-md">
              {item.badge}
            </div>
          )}
        </div>
      ))}
    </aside>
  );
}
