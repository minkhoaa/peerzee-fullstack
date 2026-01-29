interface PushPinProps {
  color?: 'red' | 'blue' | 'yellow' | 'green';
  className?: string;
}

export function PushPin({ color = 'red', className = '' }: PushPinProps) {
  const colors = {
    red: 'bg-gradient-to-br from-[#EC407A] to-[#C2185B]',
    blue: 'bg-gradient-to-br from-[#42A5F5] to-[#1976D2]',
    yellow: 'bg-gradient-to-br from-[#FFD54F] to-[#FFA000]',
    green: 'bg-gradient-to-br from-[#7CB342] to-[#558B2F]'
  };
  
  return (
    <div className={`push-pin ${colors[color]} ${className}`} />
  );
}
