import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen mesh-bg bg-[var(--bg-primary)] transition-colors duration-300">
      <Navbar />
      <main className="pt-16 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
