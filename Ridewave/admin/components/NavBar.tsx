"use client";

import { useRouter } from "next/navigation";

export function AdminNavBar() {
  const router = useRouter();

  const handleLogout = () => {
    window.localStorage.removeItem("flashride_admin_token");
    router.replace("/login");
  };

  return (
    <header className="navbar">
      <div className="brand">
        <span className="brand-mark">RW</span>
        <div className="brand-copy">
        <strong>Flashride</strong>
          <span>Administrator Console</span>
        </div>
      </div>

      <button onClick={handleLogout}>Sign out</button>

      <style jsx>{`
        .navbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .brand-mark {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #665cff, #312e81);
          color: white;
          font-weight: 700;
        }

        .brand-copy {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
          font-size: 0.85rem;
          color: #475569;
        }

        button {
          border: none;
          background: #ef4444;
          color: #ffffff;
          padding: 0.5rem 1.25rem;
          border-radius: 999px;
          font-weight: 600;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
      `}</style>
    </header>
  );
}

