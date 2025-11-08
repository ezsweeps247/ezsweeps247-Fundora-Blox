import { MobileGameLayout } from './MobileGameLayout';

interface GameCanvasProps {
  isMobile?: boolean;
}

export function GameCanvas({ isMobile = false }: GameCanvasProps) {
  return <MobileGameLayout />;
}
