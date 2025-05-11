import { useState } from 'react';

export default function AdminManualConfirm() {
  const [reference, setReference] = useState('');
  const [adminId, setAdminId] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/payments/admin-manual-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, admin_id: adminId, note }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setResult('✅ Trade marked as paid.');
      } else {
        setResult('❌ ' + (data.message || 'Failed.'));
      }
    } catch (e) {
      setResult('❌ Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded mt-10">
      <h2 className="text-xl font-bold mb-4">Admin Manual Payment Confirm</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Trade Reference</label>
          <input
            className="w-full border px-3 py-2 rounded"
            value={reference}
            onChange={e => setReference(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Admin ID</label>
          <input
            className="w-full border px-3 py-2 rounded"
            value={adminId}
            onChange={e => setAdminId(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Note (optional)</label>
          <input
            className="w-full border px-3 py-2 rounded"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-green-600 text-white rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Confirm as Paid'}
        </button>
        {result && <div className="mt-2 text-center">{result}</div>}
      </form>
    </div>
  );
}
