'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Explore', path: '/', icon: '🔥' },
    { name: 'Create', path: '/create', icon: '✨', highlight: true },
    { name: 'My Library', path: '/library', icon: '🎵' },
  ];

  return (
    <aside className="sidebar glass-panel">
      <div className="logo-container">
        <Link href="/" className="logo-link">
          <div className="logo-icon">⚡</div>
          <div className="logo-text">
            <span>MONSTAH!!!</span>
            <span className="logo-sub">MUSIC AI</span>
          </div>
        </Link>
      </div>

      <div className="create-cta-box">
        <Link href="/create" className="glow-button sidebar-create-btn">
          <span>✨ Create Song</span>
        </Link>
      </div>

      <nav className="nav-menu">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.name}</span>
              {isActive && <div className="active-pill" />}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-credits-card">
          <div className="credits-header">
            <span className="credits-label">Daily Credits</span>
            <span className="credits-count">⚡ 10 / 10</span>
          </div>
          <div className="credits-bar">
            <div className="credits-fill" style={{ width: '100%' }} />
          </div>
          <span className="credits-note">Resets at midnight</span>
        </div>
      </div>

      <style jsx>{`
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: var(--sidebar-width);
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          z-index: 100;
          border-right: 1px solid var(--border-color);
        }

        .logo-container {
          margin-bottom: 28px;
          padding: 0 8px;
        }

        .logo-link {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          background: var(--gradient-primary);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          animation: shadowSweep 3.5s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        }

        .logo-icon::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255, 255, 255, 0.45) 50%,
            transparent 100%
          );
          animation: lightBeamSweep 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          pointer-events: none;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 20px;
          letter-spacing: 0.5px;
          color: var(--text-primary);
          line-height: 1.1;
        }

        .logo-sub {
          font-size: 11px;
          font-weight: 600;
          color: var(--accent-pink);
          letter-spacing: 2px;
        }

        .create-cta-box {
          margin-bottom: 24px;
        }

        :global(.sidebar-create-btn) {
          width: 100%;
          justify-content: center;
          padding: 14px;
          font-size: 15px;
        }

        .nav-menu {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 15px;
          transition: all 0.2s ease;
          position: relative;
        }

        .nav-item:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.04);
        }

        .nav-item.active {
          color: var(--text-primary);
          background: rgba(124, 58, 237, 0.15);
          border: 1px solid rgba(124, 58, 237, 0.3);
        }

        .nav-icon {
          font-size: 18px;
        }

        .active-pill {
          position: absolute;
          right: 12px;
          width: 6px;
          height: 6px;
          background: var(--accent-pink);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--accent-pink);
        }

        .sidebar-footer {
          margin-top: auto;
          padding-top: 20px;
          border-top: 1px solid var(--border-color);
        }

        .user-credits-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .credits-header {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 600;
        }

        .credits-label {
          color: var(--text-muted);
        }

        .credits-count {
          color: var(--accent-cyan);
        }

        .credits-bar {
          height: 5px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .credits-fill {
          height: 100%;
          background: var(--gradient-primary);
        }

        .credits-note {
          font-size: 10px;
          color: var(--text-muted);
        }
      `}</style>
    </aside>
  );
}
