import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const [activeRequests, setActiveRequests] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [myReqs, incReqs] = await Promise.all([
          api.get('/requests/my-requests'),
          api.get('/requests/incoming')
        ]);
        setActiveRequests(myReqs.data);
        setIncomingRequests(incReqs.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <Link 
          to="/create-request" 
          className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20"
        >
          + New Request
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Borrower Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">📘</span> My Requests
          </h2>
          {activeRequests.length === 0 && <p className="text-muted-foreground">No active requests found.</p>}
          {activeRequests.map((req) => (
            <div key={req._id} className="p-5 border rounded-2xl bg-card shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
              <div>
                <h3 className="font-semibold text-lg">{req.item || req.description}</h3>
                <p className="text-sm text-muted-foreground">Urgency: {req.urgencyLevel}</p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  req.status === 'Matched' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {req.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Lender Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span className="p-2 bg-orange-100 text-orange-600 rounded-lg">🤝</span> Help Others (Algorithm Matches)
          </h2>
          {incomingRequests.length === 0 && <p className="text-muted-foreground">No incoming matches found yet!</p>}
          {incomingRequests.map((req) => (
            <div key={req._id} className="p-5 border border-primary/20 rounded-2xl bg-card shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 bg-primary text-primary-foreground text-xs font-bold rounded-bl-lg">
                Top Match
              </div>
              <h3 className="font-semibold text-lg">{req.borrowerName || 'User'} needs {req.item || req.description}</h3>
              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex border px-2 py-1 rounded bg-background">Distance: {req.matchDistance || 'N/A'}</span>
                <span className="flex border px-2 py-1 rounded bg-background">Trust: {req.borrowerTrustScore || 'N/A'}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all">
                  Accept Match
                </button>
                <button className="flex-1 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-all">
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
