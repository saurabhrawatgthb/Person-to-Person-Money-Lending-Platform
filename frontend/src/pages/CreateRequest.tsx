import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function CreateRequest() {
  const navigate = useNavigate();
  const [type, setType] = useState('Item');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('Medium');
  const [duration, setDuration] = useState('2');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/requests', {
        type,
        description,
        urgencyLevel: urgency,
        durationHours: Number(duration)
      });
      // The backend matches in the background, redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert('Failed to create request');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-card border rounded-3xl shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-2">Create a Request</h1>
        <p className="text-muted-foreground mb-8">Our algorithm will instantly find the best person to help you based on campus proximity and trust.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex p-1 bg-secondary rounded-lg">
            <button
              type="button"
              onClick={() => setType('Item')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${type === 'Item' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
            >
              Item Need
            </button>
            <button
              type="button"
              onClick={() => setType('Money')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${type === 'Money' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
            >
              Small Loan
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'Item' ? "E.g., Need a scientific calculator for my 3PM exam" : "E.g., Need $20 for lunch, will repay tomorrow"}
              className="w-full p-4 rounded-xl border bg-background focus:ring-2 focus:ring-primary transition-all outline-none" 
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Urgency</label>
              <select 
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full p-4 rounded-xl border bg-background focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration (Hours)</label>
              <input 
                type="number" 
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="2"
                className="w-full p-4 rounded-xl border bg-background focus:ring-2 focus:ring-primary transition-all outline-none" 
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-4 text-lg bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-[0.98] mt-4"
          >
            Find a Match
          </button>
        </form>
      </div>
    </div>
  );
}
