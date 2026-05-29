import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowRight, DollarSign, Percent, Clock, FileText } from 'lucide-react';

export default function CreateRequest() {
  const navigate = useNavigate();
  const [type, setType] = useState('Money'); // Default to Money
  const [requestType, setRequestType] = useState('Borrow'); // Borrow or Lend
  const [amount, setAmount] = useState('100');
  const [interestRate, setInterestRate] = useState('5');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('Medium');
  const [duration, setDuration] = useState('24');
  const [loading, setLoading] = useState(false);

  // Calculate live return amount
  const amt = Number(amount) || 0;
  const rate = Number(interestRate) || 0;
  const repaymentAmount = amt * (1 + rate / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/requests', {
        type,
        requestType: type === 'Money' ? requestType : undefined,
        amount: type === 'Money' ? amt : undefined,
        interestRate: type === 'Money' ? rate : undefined,
        description,
        urgencyLevel: urgency,
        durationHours: Number(duration)
      });
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert('Failed to submit post/request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 animate-in slide-in-from-bottom-8 duration-500">
      <div className="backdrop-blur-xl bg-card/75 border border-white/10 rounded-[2.5rem] shadow-2xl p-8 relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px]" />

        <div className="relative">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent mb-2">
            Create Platform Post
          </h1>
          <p className="text-muted-foreground mb-8">
            Define your terms transparently. Peers will be notified instantly to match your terms.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Category: Item or Money */}
            <div className="space-y-2">
              <label className="block text-xs font-bold tracking-wider uppercase text-muted-foreground/80">Category</label>
              <div className="flex p-1 bg-secondary/50 backdrop-blur border rounded-xl">
                <button
                  type="button"
                  onClick={() => setType('Money')}
                  className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${type === 'Money' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  💵 Money Lending & Borrowing
                </button>
                <button
                  type="button"
                  onClick={() => setType('Item')}
                  className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${type === 'Item' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  📦 Item Sharing
                </button>
              </div>
            </div>

            {/* Money-Specific Sub-Role selection */}
            {type === 'Money' && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <label className="block text-xs font-bold tracking-wider uppercase text-muted-foreground/80">Your Financial Role</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRequestType('Borrow')}
                    className={`p-4 rounded-2xl border text-left transition-all ${requestType === 'Borrow' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card/30 hover:border-muted-foreground/50'}`}
                  >
                    <div className="text-lg font-bold">🙋‍♂️ Need Money</div>
                    <div className="text-xs text-muted-foreground mt-1">Raise a Borrow Request to find a campus lender</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestType('Lend')}
                    className={`p-4 rounded-2xl border text-left transition-all ${requestType === 'Lend' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card/30 hover:border-muted-foreground/50'}`}
                  >
                    <div className="text-lg font-bold">🤝 Have Money</div>
                    <div className="text-xs text-muted-foreground mt-1">Post your available capital to lend to trusted peers</div>
                  </button>
                </div>
              </div>
            )}

            {/* Money Parameters */}
            {type === 'Money' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <label className="block text-xs font-bold tracking-wider uppercase text-muted-foreground/80">Amount ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="100"
                      className="w-full p-4 pl-12 rounded-2xl border bg-background/50 focus:ring-2 focus:ring-primary transition-all outline-none" 
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold tracking-wider uppercase text-muted-foreground/80">Interest Rate (%)</label>
                  <div className="relative">
                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input 
                      type="number" 
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      placeholder="5"
                      className="w-full p-4 pl-12 rounded-2xl border bg-background/50 focus:ring-2 focus:ring-primary transition-all outline-none" 
                      min="0"
                      step="0.1"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-xs font-bold tracking-wider uppercase text-muted-foreground/80">Description / Details</label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    type === 'Item' 
                      ? "E.g., Need a scientific calculator for my 3PM exam in Room 204" 
                      : requestType === 'Borrow'
                        ? "E.g., Need $100 to purchase textbooks, will repay on payday"
                        : "E.g., Willing to lend short-term to peers with high trust score"
                  }
                  className="w-full p-4 pl-12 min-h-[100px] rounded-2xl border bg-background/50 focus:ring-2 focus:ring-primary transition-all outline-none resize-none" 
                  required
                />
              </div>
            </div>

            {/* Duration and Urgency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold tracking-wider uppercase text-muted-foreground/80">Duration (Hours)</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input 
                    type="number" 
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="24"
                    className="w-full p-4 pl-12 rounded-2xl border bg-background/50 focus:ring-2 focus:ring-primary transition-all outline-none" 
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold tracking-wider uppercase text-muted-foreground/80">Urgency Level</label>
                <select 
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full p-4 rounded-2xl border bg-background/50 focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            {/* Repayment Interest Card Widget */}
            {type === 'Money' && (
              <div className="p-5 border border-white/10 rounded-2xl bg-secondary/20 backdrop-blur-md space-y-3 animate-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Principal Loan Amount</span>
                  <span className="font-semibold text-foreground">${amt.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Interest ({rate}%)</span>
                  <span className="font-semibold text-primary">+${(repaymentAmount - amt).toFixed(2)}</span>
                </div>
                <div className="h-[1px] bg-border my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-foreground">Total Repayment Amount</span>
                  <span className="text-xl font-black bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                    ${repaymentAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-primary text-primary-foreground font-extrabold rounded-2xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2 group"
            >
              {loading ? 'Submitting...' : (
                <>
                  {requestType === 'Lend' && type === 'Money' ? 'Publish Lending Pool' : 'Broadcast to Campus'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

