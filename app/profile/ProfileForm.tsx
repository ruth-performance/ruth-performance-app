'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2 } from 'lucide-react';

interface AthleteProfile {
  email: string;
  name?: string;
  gender?: 'male' | 'female';
  weight?: number;
  height?: number;
  competitionTier?: 'open' | 'quarterfinals' | 'semifinals' | 'games';
}

interface ProfileFormProps {
  athlete: AthleteProfile | null;
  email: string;
}

export default function ProfileForm({ athlete, email }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    name: athlete?.name || '',
    gender: athlete?.gender || '',
    weight: athlete?.weight?.toString() || '',
    height: athlete?.height?.toString() || '',
    competitionTier: athlete?.competitionTier || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          ...formData,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          height: formData.height ? parseFloat(formData.height) : undefined,
        }),
      });

      if (res.ok) {
        setMessage('Profile updated successfully!');
        router.refresh();
      } else {
        setMessage('Failed to update profile. Please try again.');
      }
    } catch {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-ruth-card border border-ruth-border rounded-2xl p-6 space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 bg-ruth-dark border border-ruth-border rounded-lg text-white focus:outline-none focus:border-ruth-cyan"
          required
        />
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Gender
        </label>
        <div className="flex gap-4">
          {['male', 'female'].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setFormData({ ...formData, gender: g })}
              className={`flex-1 py-3 px-4 rounded-lg border font-medium capitalize transition-all ${
                formData.gender === g
                  ? 'bg-gradient-ruth text-white border-transparent'
                  : 'bg-ruth-dark text-gray-400 border-ruth-border hover:border-ruth-cyan'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Weight & Height */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-300 mb-2">
            Weight (lbs)
          </label>
          <input
            type="number"
            id="weight"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            placeholder="185"
            className="w-full px-4 py-3 bg-ruth-dark border border-ruth-border rounded-lg text-white focus:outline-none focus:border-ruth-cyan"
          />
        </div>
        <div>
          <label htmlFor="height" className="block text-sm font-medium text-gray-300 mb-2">
            Height (inches)
          </label>
          <input
            type="number"
            id="height"
            value={formData.height}
            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
            placeholder="70"
            className="w-full px-4 py-3 bg-ruth-dark border border-ruth-border rounded-lg text-white focus:outline-none focus:border-ruth-cyan"
          />
        </div>
      </div>

      {/* Competition Tier */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Competition Tier
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'open', label: 'Open', color: 'from-green-500 to-emerald-500' },
            { value: 'quarterfinals', label: 'Quarterfinals', color: 'from-blue-500 to-cyan-500' },
            { value: 'semifinals', label: 'Semifinals', color: 'from-purple-500 to-violet-500' },
            { value: 'games', label: 'Games', color: 'from-orange-500 to-red-500' },
          ].map((tier) => (
            <button
              key={tier.value}
              type="button"
              onClick={() => setFormData({ ...formData, competitionTier: tier.value })}
              className={`py-3 px-4 rounded-lg border font-medium transition-all ${
                formData.competitionTier === tier.value
                  ? `bg-gradient-to-r ${tier.color} text-white border-transparent`
                  : 'bg-ruth-dark text-gray-400 border-ruth-border hover:border-ruth-cyan'
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      {message && (
        <p className={`text-sm ${message.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-gradient-ruth text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Save Profile
          </>
        )}
      </button>
    </form>
  );
}
