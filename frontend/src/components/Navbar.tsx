import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <nav className="border-b bg-card py-4 px-6 flex justify-between items-center shadow-sm">
      <Link to="/" className="text-xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
        SmartPeer
      </Link>
      
      <div className="flex gap-4 items-center">
        {user ? (
          <>
            <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">Dashboard</Link>
            <Link to="/create-request" className="text-sm font-medium hover:text-primary transition-colors">Request</Link>
            <Link to="/profile" className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full border hover:bg-secondary/80 transition-all">
               <span className="font-semibold text-primary">{user.trustScore}</span>
               <span className="text-sm">{user.name.split(' ')[0]}</span>
            </Link>
          </>
        ) : (
          <Link to="/auth" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-sm hover:bg-primary/90 transition-all">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
