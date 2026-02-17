import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';

export function Layout() {
  return (
    <div className="min-h-screen bg-f1-bg scanlines">
      <TopNav />
      <main className="max-w-[1400px] mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
