import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder login action
    setUser({
      _id: 'mock_123',
      name: 'John Doe',
      email: 'john@university.edu',
      trustScore: 100,
      token: 'mock_jwt_token'
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border rounded-2xl shadow-xl p-8 animate-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-3xl font-bold text-center mb-6">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe" 
                className="w-full p-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary transition-all outline-none" 
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              placeholder="you@university.edu" 
              className="w-full p-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary transition-all outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full p-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary transition-all outline-none" 
            />
          </div>
          <button 
            type="submit" 
            className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-md active:scale-[0.98]"
          >
            {isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-primary font-medium hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
}
