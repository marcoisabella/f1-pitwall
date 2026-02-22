import { Outlet } from 'react-router-dom';
import { FantasySidebar } from './FantasySidebar';

export function FantasyLayout() {
  return (
    <div className="flex h-full -m-4">
      <FantasySidebar />
      <div className="flex-1 overflow-y-auto p-4">
        <Outlet />
      </div>
    </div>
  );
}
