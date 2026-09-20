'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import AudioPlayer from '../components/AudioPlayer';
import ToastContainer from '../components/Toast';
import { PlayerProvider } from '../context/PlayerContext';
import '../styles/globals.css';

const navItems = [
  { name: 'Explore', path: '/',        icon: '🔥' },
  { name: 'Create',  path: '/create',  icon: '✨' },
  { name: 'Library', path: '/library', icon: '🎵' },
];

function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="mobile-bottom-nav glass-panel">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.name}</span>
          </Link>
        );
      })}

      <style jsx>{`
        .mobile-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: var(--mobile-nav-height);
          z-index: 110;
          border-top: 1px solid var(--border-color);
          border-bottom: none;
          border-left: none;
          border-right: none;
          border-radius: 0;
          flex-direction: row;
          align-items: stretch;
        }

        .mobile-nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 8px 0;
          color: var(--text-muted);
          transition: color 0.2s ease;
        }

        .mobile-nav-item.active {
          color: var(--accent-pink);
        }

        .mobile-nav-icon {
          font-size: 20px;
        }

        .mobile-nav-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.3px;
        }

        @media (max-width: 768px) {
          .mobile-bottom-nav {
            display: flex;
          }
        }
      `}</style>
    </nav>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Monstah Music — AI Music Generator</title>
        <meta name="description" content="Generate original songs, lyrics, and full backing tracks with Stability AI Stable Audio. Professional quality AI music in seconds." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>" />
      </head>
      <body>
        <PlayerProvider>
          <div className="app-container">
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
            <AudioPlayer />
            <MobileBottomNav />
            <ToastContainer />
          </div>
        </PlayerProvider>
      </body>
    </html>
  );
}
