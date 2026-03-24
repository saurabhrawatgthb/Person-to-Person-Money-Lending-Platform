import { useAuthStore } from '../store/authStore';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in zoom-in-95 duration-500">
      <div className="bg-card border rounded-3xl shadow-sm overflow-hidden flex flex-col md:flex-row">
        
        {/* Left column info */}
        <div className="md:w-1/3 bg-secondary/30 p-8 flex flex-col items-center border-r text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary text-3xl font-bold shadow-inner">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user?.name || 'User Name'}</h2>
            <p className="text-muted-foreground text-sm">{user?.email || 'user@university.edu'}</p>
          </div>
          
          <div className="bg-background rounded-full px-4 py-2 mt-4 border shadow-sm font-medium flex items-center gap-2">
            🛡️ Trust Score: <span className="font-bold text-primary">{user?.trustScore || '100'}</span>
          </div>

          <div className="pt-8 w-full">
             <button 
               onClick={logout}
               className="w-full py-2 bg-red-100 text-red-600 font-semibold rounded-lg hover:bg-red-200 transition-all"
             >
               Log Out
             </button>
          </div>
        </div>

        {/* Right column history */}
        <div className="md:w-2/3 p-8">
          <h3 className="text-xl font-bold mb-6 border-b pb-2">Platform History</h3>
          
          <div className="space-y-4">
            <div className="p-4 border rounded-xl flex justify-between items-center group hover:bg-secondary/20 transition-all">
              <div>
                <p className="font-semibold">Lent Scientific Calculator</p>
                <p className="text-sm text-muted-foreground">To Alice M. • 2 days ago</p>
              </div>
              <div className="text-right">
                <div className="text-green-600 font-bold flex text-sm items-center gap-1">
                  Returned <span className="text-lg">✅</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 text-yellow-500">
                  ⭐⭐⭐⭐⭐
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-xl flex justify-between items-center group hover:bg-secondary/20 transition-all">
              <div>
                <p className="font-semibold">Borrowed $20</p>
                <p className="text-sm text-muted-foreground">From John D. • 1 week ago</p>
              </div>
              <div className="text-right">
                <div className="text-green-600 font-bold flex text-sm items-center gap-1">
                  Repaid <span className="text-lg">✅</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 text-yellow-500">
                  ⭐⭐⭐⭐⭐
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
