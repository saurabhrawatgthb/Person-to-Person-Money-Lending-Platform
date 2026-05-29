import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { 
  Shield, 
  Clock, 
  ArrowUpRight, 
  PlusCircle, 
  Users, 
  Activity
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const [myRequests, setMyRequests] = useState<any[]>([]);

  if (!user) return null;
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [activeTransactions, setActiveTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState<{ isOpen: boolean; transactionId: string; ratedUserName: string } | null>(null);
  const [ratingValue, setRatingValue] = useState(5);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [myReqs, incReqs, activeTx] = await Promise.all([
        api.get('/requests/my-requests'),
        api.get('/requests/incoming'),
        api.get('/transactions/active')
      ]);
      setMyRequests(myReqs.data);
      setIncomingRequests(incReqs.data);
      setActiveTransactions(activeTx.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }

    // Connect to global socket notifications to live refresh data
    const handleNotification = () => {
      fetchDashboardData();
    };

    window.addEventListener('socket_notification_received', handleNotification);
    return () => {
      window.removeEventListener('socket_notification_received', handleNotification);
    };
  }, [user]);

  const handleAcceptMatch = async (requestId: string) => {
    try {
      await api.post('/requests/accept', { requestId });
      alert('🎉 You successfully matched and accepted this transaction!');
      fetchDashboardData();
    } catch (error: any) {
      console.error('Error accepting request:', error);
      alert(error.response?.data?.message || 'Failed to accept');
    }
  };

  const handleRepayLoan = async (transactionId: string) => {
    try {
      const res = await api.post('/transactions/return', { transactionId });
      const { trustAdjustment, trustScore, transaction } = res.data;
      
      alert(`✅ Repayment recorded successfully! Your trust score is now ${trustScore} (${trustAdjustment > 0 ? '+' : ''}${trustAdjustment}).`);
      
      // Update local storage and store user trustScore
      if (user) {
        setUser({ ...user, trustScore });
      }

      // Open rating modal to rate the lender
      const lenderName = transaction.lender_id?.name || 'Lender';
      setRatingModal({
        isOpen: true,
        transactionId,
        ratedUserName: lenderName
      });
      
      fetchDashboardData();
    } catch (error: any) {
      console.error('Error repaying loan:', error);
      alert(error.response?.data?.message || 'Repayment failed');
    }
  };

  const handleRatePeer = async () => {
    if (!ratingModal) return;
    try {
      await api.post('/transactions/complete', {
        transactionId: ratingModal.transactionId,
        rating: ratingValue
      });
      alert('⭐⭐⭐⭐⭐ Thank you for rating your peer!');
      setRatingModal(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Error rating peer:', error);
      alert('Failed to submit rating');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Matched': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Completed': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      default: return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-500 relative">
      
      {/* Background Decorative Blur */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/50 pb-6 relative z-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            Welcome, {user?.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Build reputation, lend securely, and help your campus grow.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="backdrop-blur bg-card/40 border border-white/5 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
              🛡️
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Campus Trust</div>
              <div className="text-lg font-black text-primary">{user?.trustScore || 100} / 100</div>
            </div>
          </div>

          <Link 
            to="/create-request" 
            className="flex items-center gap-2 px-6 py-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
          >
            <PlusCircle className="w-5 h-5" /> New Post
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground animate-pulse">Loading campus board...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          
          {/* Main Work Board (2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Active Deals / Loans */}
            <div className="backdrop-blur-md bg-card/30 border rounded-[2rem] p-6 space-y-4 shadow-xl">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <Activity className="w-5 h-5" />
                </span>
                Active Transactions
              </h2>

              {activeTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-secondary/10 rounded-2xl border border-dashed">
                  No active loans or shared items currently in progress.
                </div>
              ) : (
                <div className="space-y-4">
                  {activeTransactions.map((tx) => {
                    const isBorrower = tx.borrower_id?._id === user?._id;
                    const peerName = isBorrower ? tx.lender_id?.name : tx.borrower_id?.name;
                    const peerTrust = isBorrower ? tx.lender_id?.trustScore : tx.borrower_id?.trustScore;

                    return (
                      <div key={tx._id} className="p-5 border border-white/5 rounded-2xl bg-card/65 backdrop-blur shadow-md hover:shadow-lg transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-lg text-foreground">
                              {tx.amount > 0 ? `P2P Loan: $${tx.amount}` : `Item Loan`}
                            </span>
                            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getStatusColor(tx.status)}`}>
                              {tx.status}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">
                              {isBorrower ? 'Borrowing' : 'Lending'}
                            </span>
                          </div>

                          <div className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
                            <span>Peer: <strong className="text-foreground">{peerName}</strong> (🛡️ {peerTrust})</span>
                            {tx.interestRate > 0 && (
                              <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-lg text-xs font-bold">
                                Interest: {tx.interestRate}%
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span>Due repayment date: <strong>{new Date(tx.dueDate).toLocaleString()}</strong></span>
                          </div>
                        </div>

                        <div className="w-full md:w-auto text-right flex flex-col items-stretch md:items-end gap-2">
                          {tx.amount > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Repayment amount: <strong className="text-emerald-400 text-lg font-black">${tx.repaymentAmount.toFixed(2)}</strong>
                            </div>
                          )}
                          
                          {isBorrower && tx.status === 'Active' ? (
                            <button 
                              onClick={() => handleRepayLoan(tx._id)}
                              className="px-5 py-2.5 bg-emerald-500 text-white font-extrabold rounded-xl hover:bg-emerald-600 transition-all shadow-md active:scale-95"
                            >
                              Repay Loan
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground border px-3 py-1.5 rounded-xl bg-secondary/30">
                              Awaiting repayment
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Campus Opportunities (Accept offers/needs) */}
            <div className="backdrop-blur-md bg-card/30 border rounded-[2rem] p-6 space-y-4 shadow-xl">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                <span className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                  <Users className="w-5 h-5" />
                </span>
                Campus Open Board
              </h2>

              {incomingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-secondary/10 rounded-2xl border border-dashed">
                  No other active requests or lending pools on campus right now!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incomingRequests.map((req) => (
                    <div key={req._id} className="p-5 border border-white/5 rounded-2xl bg-card/60 hover:border-primary/40 hover:-translate-y-0.5 transition-all shadow relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-xs font-black rounded-bl-xl uppercase tracking-widest">
                        {req.type === 'Money' ? `${req.requestType}er` : 'Item'}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground shadow-inner">
                            {req.user_id?.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-foreground text-sm">{req.user_id?.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              🛡️ Trust Score: <strong className="text-primary font-bold">{req.user_id?.trustScore || 100}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-foreground line-clamp-2">"{req.description}"</p>
                          
                          {req.type === 'Money' && (
                            <div className="flex gap-2">
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-xl text-xs font-black">
                                Value: ${req.amount}
                              </span>
                              <span className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-xl text-xs font-black">
                                Interest: {req.interestRate}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-border/50 flex justify-between items-center gap-2">
                        <span className="text-xs text-muted-foreground">Term: {req.durationHours} hrs</span>
                        <button 
                          onClick={() => handleAcceptMatch(req._id)}
                          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow flex items-center gap-1 active:scale-95"
                        >
                          {req.type === 'Money' 
                            ? req.requestType === 'Lend' ? 'Borrow from Peer' : 'Fund Loan'
                            : 'Fulfill Request'}
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: User Listings & Activity (1 col) */}
          <div className="space-y-8">
            
            {/* My Active Posts */}
            <div className="backdrop-blur-md bg-card/30 border rounded-[2rem] p-6 space-y-4 shadow-xl">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                <span className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
                  <ArrowUpRight className="w-5 h-5" />
                </span>
                My Active Posts
              </h2>

              {myRequests.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  You haven't posted any active requests or offers yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {myRequests.map((req) => (
                    <div key={req._id} className="p-4 border border-white/5 rounded-2xl bg-card/65 shadow-sm space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase text-muted-foreground">
                          {req.type === 'Money' ? `${req.requestType} Pool` : 'Item Post'}
                        </span>
                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getStatusColor(req.status)}`}>
                          {req.status}
                        </span>
                      </div>
                      
                      <p className="text-sm font-semibold text-foreground line-clamp-1">{req.description}</p>
                      
                      {req.type === 'Money' && (
                        <div className="text-xs text-muted-foreground flex justify-between">
                          <span>Amount: <strong>${req.amount}</strong></span>
                          <span>Repayment: <strong>${req.repaymentAmount.toFixed(2)} ({req.interestRate}%)</strong></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Visualizer Help Box */}
            <div className="p-5 border border-primary/20 rounded-[2rem] bg-gradient-to-br from-primary/10 to-blue-500/5 space-y-3 shadow-md relative overflow-hidden">
              <div className="absolute right-0 top-0 text-7xl opacity-5 select-none pointer-events-none">🛡️</div>
              <h3 className="font-bold text-primary flex items-center gap-1.5">
                <Shield className="w-5 h-5" /> How Trust Works
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Repaying your active peer loans <strong>before or on the due date</strong> increases your Campus Trust Score by <strong>+10 points</strong>. 
                Returning loans late penalizes your reputation by <strong>-20 points</strong>. Keep your reputation high to get the lowest campus interest rates!
              </p>
            </div>

          </div>

        </div>
      )}

      {/* Peer Rating Modal overlay */}
      {ratingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-background/40 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-card border border-white/10 p-6 rounded-[2rem] shadow-2xl relative space-y-6">
            <div className="text-center space-y-2">
              <div className="text-4xl text-yellow-400">⭐</div>
              <h3 className="text-2xl font-bold text-foreground">Rate your peer</h3>
              <p className="text-sm text-muted-foreground">
                Help the campus community by rating your experience with <strong>{ratingModal.ratedUserName}</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-center font-bold text-lg text-primary">{ratingValue} Star{ratingValue !== 1 ? 's' : ''}</div>
              <input 
                type="range" 
                min="1" 
                max="5" 
                step="1"
                value={ratingValue}
                onChange={(e) => setRatingValue(Number(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 - Terrible</span>
                <span>5 - Exceptional</span>
              </div>
            </div>

            <button 
              onClick={handleRatePeer}
              className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary/90 transition-all active:scale-95 shadow"
            >
              Submit Peer Review
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

