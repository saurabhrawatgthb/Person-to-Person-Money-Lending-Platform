import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { 
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

  const mockNodes = [
    { id: 1, name: 'Rajesh Kumar', trustScore: 95, distance: 2.4, x: 80, y: 70 },
    { id: 2, name: 'Priya Sharma', trustScore: 92, distance: 4.8, x: 280, y: 60 },
    { id: 3, name: 'Amit Singh', trustScore: 78, distance: 1.2, x: 320, y: 180 },
    { id: 4, name: 'Sneha Patel', trustScore: 85, distance: 5.1, x: 90, y: 220 },
    { id: 5, name: 'Vikram Reddy', trustScore: 89, distance: 3.5, x: 200, y: 260 }
  ];

  const [activeStep, setActiveStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(mockNodes[0]);

  const runDijkstraSweep = () => {
    setAnimating(true);
    setActiveStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setActiveStep(step);
      if (step >= 5) {
        clearInterval(interval);
        setAnimating(false);
        setSelectedNode(mockNodes[0]);
      }
    }, 600);
  };

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

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('🗑️ Are you sure you want to delete this request/offer?')) return;
    try {
      await api.delete(`/requests/${requestId}`);
      alert('✅ Request successfully deleted!');
      fetchDashboardData();
    } catch (error: any) {
      console.error('Error deleting request:', error);
      alert(error.response?.data?.message || 'Failed to delete request');
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
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
            Welcome, {user?.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Build reputation, lend securely, and help the global financial network grow.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="backdrop-blur bg-card/40 border border-white/5 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
              🛡️
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Global Trust Network</div>
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
        <div className="text-center py-20 text-muted-foreground animate-pulse">Loading global financial board...</div>
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
                    const isBorrower = (tx.borrower_id?._id || (tx.borrower_id as any)?.id) === (user?._id || (user as any)?.id);
                    const peerName = isBorrower ? tx.lender_id?.name : tx.borrower_id?.name;
                    const peerTrust = isBorrower ? tx.lender_id?.trustScore : tx.borrower_id?.trustScore;

                    return (
                      <div key={tx.id || tx._id} className="p-5 border border-white/5 rounded-2xl bg-card/65 backdrop-blur shadow-md hover:shadow-lg transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-lg text-foreground">
                              {tx.amount > 0 ? `P2P Loan: ₹${tx.amount.toLocaleString('en-IN')}` : `Item Loan`}
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
                              Repayment amount: <strong className="text-emerald-400 text-lg font-black">₹{tx.repaymentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                            </div>
                          )}
                          
                          {isBorrower && tx.status === 'Active' ? (
                            <button 
                              onClick={() => handleRepayLoan(tx.id || tx._id)}
                              className="px-5 py-2.5 bg-emerald-500 text-white font-extrabold rounded-xl hover:bg-emerald-600 transition-all shadow-md active:scale-95 border border-emerald-500/20"
                            >
                              Repay Loan
                            </button>
                          ) : tx.status === 'Returned' ? (
                            // Completed but needs rating
                            ((isBorrower && tx.ratingByBorrower === undefined) || (!isBorrower && tx.ratingByLender === undefined)) ? (
                              <button 
                                onClick={() => setRatingModal({
                                  isOpen: true,
                                  transactionId: tx.id || tx._id,
                                  ratedUserName: peerName
                                })}
                                className="px-5 py-2.5 bg-amber-500 text-white font-extrabold rounded-xl hover:bg-amber-600 transition-all shadow-md active:scale-95 border border-amber-500/20 text-xs uppercase tracking-wider"
                              >
                                Rate Peer
                              </button>
                            ) : (
                              <span className="text-xs text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl bg-emerald-500/10 font-black">
                                Repaid & Rated ✅
                              </span>
                            )
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

            {/* Global Board Opportunities */}
            <div className="backdrop-blur-md bg-card/30 border rounded-[2rem] p-6 space-y-4 shadow-xl">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                <span className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                  <Users className="w-5 h-5" />
                </span>
                Global Lending Pools
              </h2>

              {incomingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-secondary/10 rounded-2xl border border-dashed">
                  No other active requests or lending pools on the network right now!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incomingRequests.map((req) => (
                    <div key={req.id || req._id} className="p-5 border border-white/5 rounded-2xl bg-card/60 hover:border-primary/40 hover:-translate-y-0.5 transition-all shadow relative overflow-hidden flex flex-col justify-between">
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
                              🛡️ Reputation: <strong className="text-primary font-bold">{req.user_id?.trustScore || 100}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-foreground line-clamp-2">"{req.description}"</p>
                          
                          {req.type === 'Money' && (
                            <div className="flex gap-2">
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-xl text-xs font-black">
                                Value: ₹{req.amount.toLocaleString('en-IN')}
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
                          onClick={() => handleAcceptMatch(req.id || req._id)}
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
                    <div key={req.id || req._id} className="p-4 border border-white/5 rounded-2xl bg-card/65 shadow-sm space-y-2 relative group">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase text-muted-foreground">
                          {req.type === 'Money' ? `${req.requestType} Pool` : 'Item Post'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getStatusColor(req.status)}`}>
                            {req.status}
                          </span>
                          {req.status === 'Open' && (
                            <button 
                              onClick={() => handleDeleteRequest(req.id || req._id)}
                              className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg border border-red-500/20 transition-all active:scale-95 text-xs"
                              title="Delete Post"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm font-semibold text-foreground line-clamp-1">{req.description}</p>
                      
                      {req.type === 'Money' && (
                        <div className="text-xs text-muted-foreground flex justify-between">
                          <span>Amount: <strong>₹{req.amount.toLocaleString('en-IN')}</strong></span>
                          <span>Repayment: <strong>₹{req.repaymentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({req.interestRate}%)</strong></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Dijkstra Matchmaking Visualizer */}
            <div className="p-6 border border-primary/30 rounded-[2rem] bg-card/40 backdrop-blur-md space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
                  <span className="p-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg">
                    🛡️
                  </span>
                  Dijkstra O(E log V) Engine
                </h3>
                <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/25 px-2 py-0.5 rounded-full animate-pulse">
                  Live Simulator
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Our algorithm finds matches by computing the shortest path where edge weight represents risk: <br />
                <code className="text-primary font-bold">Weight = Distance (km) + (1000 / Trust Score)</code>.
              </p>

              {/* Interactive SVG Graph Area */}
              <div className="bg-background/40 border border-white/5 rounded-2xl p-2 relative h-64 select-none overflow-hidden shadow-inner">
                <svg className="w-full h-full" viewBox="0 0 400 300">
                  {/* Central Node ("You") */}
                  <g transform="translate(200, 150)">
                    <circle r="15" className="fill-primary/20 stroke-primary stroke-2 animate-ping opacity-75" />
                    <circle r="10" className="fill-primary stroke-background stroke-2" />
                  </g>
                  
                  {/* Node Connections & Edges */}
                  {mockNodes.map((n) => {
                    const isOptimal = n.id === 1;
                    let strokeColor = 'stroke-border/40';
                    let strokeWidth = 1.5;
                    let dashArray = '';
                    
                    if (animating) {
                      if (activeStep >= n.id) {
                        strokeColor = isOptimal ? 'stroke-primary animate-pulse' : 'stroke-amber-400';
                        strokeWidth = isOptimal ? 3.5 : 2;
                      }
                    } else if (selectedNode?.id === n.id) {
                      strokeColor = 'stroke-primary';
                      strokeWidth = 3;
                    } else if (isOptimal) {
                      strokeColor = 'stroke-primary/60';
                      strokeWidth = 2.5;
                      dashArray = '4 2';
                    }

                    return (
                      <g key={n.id}>
                        {/* Edge line */}
                        <line 
                          x1="200" 
                          y1="150" 
                          x2={n.x} 
                          y2={n.y} 
                          className={`transition-all duration-500 ${strokeColor}`}
                          strokeWidth={strokeWidth}
                          strokeDasharray={dashArray}
                        />
                        
                        {/* Edge weight badge background */}
                        <rect 
                          x={(200 + n.x) / 2 - 14} 
                          y={(150 + n.y) / 2 - 8} 
                          width="28" 
                          height="16" 
                          rx="4" 
                          className="fill-background/90 stroke-border/20 stroke"
                        />
                        {/* Edge weight label */}
                        <text 
                          x={(200 + n.x) / 2} 
                          y={(150 + n.y) / 2 + 4} 
                          textAnchor="middle" 
                          className="text-[9px] font-bold fill-muted-foreground"
                        >
                          {(n.distance + (1000 / n.trustScore)).toFixed(1)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  {mockNodes.map((n) => {
                    const isOptimal = n.id === 1;
                    const isSelected = selectedNode?.id === n.id;
                    let nodeFill = 'fill-secondary/80';
                    let nodeStroke = 'stroke-border';
                    
                    if (animating) {
                      if (activeStep >= n.id) {
                        nodeFill = isOptimal ? 'fill-primary animate-pulse' : 'fill-amber-400';
                        nodeStroke = isOptimal ? 'stroke-white' : 'stroke-amber-500';
                      }
                    } else if (isSelected) {
                      nodeFill = 'fill-primary';
                      nodeStroke = 'stroke-white';
                    } else if (isOptimal) {
                      nodeFill = 'fill-primary/40';
                      nodeStroke = 'stroke-primary';
                    }

                    return (
                      <g 
                        key={n.id} 
                        transform={`translate(${n.x}, ${n.y})`}
                        onClick={() => setSelectedNode(n)}
                        className="cursor-pointer group animate-in zoom-in duration-300"
                      >
                        <circle 
                          r="12" 
                          className={`transition-all duration-300 ${nodeFill} ${nodeStroke} hover:scale-125 stroke-2`} 
                        />
                        <text 
                          y="-16" 
                          textAnchor="middle" 
                          className="text-[9px] font-extrabold fill-foreground pointer-events-none tracking-tight"
                        >
                          {n.name.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* Central Node Label */}
                  <text 
                    x="200" 
                    y="178" 
                    textAnchor="middle" 
                    className="text-[10px] font-black fill-primary uppercase tracking-widest pointer-events-none"
                  >
                    You
                  </text>
                </svg>
              </div>

              {/* Controls and Node Info */}
              <div className="space-y-3">
                <button 
                  onClick={runDijkstraSweep}
                  disabled={animating}
                  className="w-full py-2.5 bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 border border-primary/20 shadow-md shadow-primary/10"
                >
                  {animating ? 'Calculating Dijkstra Path...' : 'Trigger Matchmaking Sweep'}
                </button>

                {/* Node Detail Box */}
                <div className="p-3 bg-secondary/25 border border-white/5 rounded-xl text-[11px] min-h-[75px] flex flex-col justify-center">
                  {selectedNode ? (
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">{selectedNode.name}</span>
                        <span className="text-primary">🛡️ Reputation {selectedNode.trustScore}</span>
                      </div>
                      <div className="text-muted-foreground flex justify-between">
                        <span>Distance: {selectedNode.distance} km</span>
                        <span>Dijkstra Cost: <strong className="text-foreground">{(selectedNode.distance + (1000 / selectedNode.trustScore)).toFixed(2)}</strong></span>
                      </div>
                      <p className="text-[10px] text-primary/80 italic pt-1 border-t border-white/5 mt-1">
                        {selectedNode.id === 1 ? '🥇 Best Match found! Lowest mathematical risk path.' : 'Eligible lender in P2P global pool.'}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground italic">
                      Click any peer node in the graph above to trace the path cost metrics.
                    </div>
                  )}
                </div>
              </div>
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

