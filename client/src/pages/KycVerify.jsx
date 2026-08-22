// client/src/pages/KycVerify.jsx
import React, { useState } from 'react';

export default function KycVerify() {
  const [files, setFiles] = useState({});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const { name, files: selected } = e.target;
    if (selected.length) {
      const file = selected[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result.split(',')[1];
        setFiles((prev) => ({ ...prev, [name]: { filename: file.name, content: base64 } }));
      };
      reader.readAsDataURL(file);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const payload = { documents: Object.values(files) };
      const res = await fetch('http://localhost:8000/verify-kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Verification failed');
      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">AI Document Verification</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Aadhaar (PDF/Image)</label>
          <input type="file" name="aadhar" accept="image/*,.pdf" onChange={handleFileChange} className="block w-full" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">PAN (PDF/Image)</label>
          <input type="file" name="pan" accept="image/*,.pdf" onChange={handleFileChange} className="block w-full" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">GST (PDF/Image)</label>
          <input type="file" name="gst" accept="image/*,.pdf" onChange={handleFileChange} className="block w-full" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Udyam (PDF/Image) – optional</label>
          <input type="file" name="udyam" accept="image/*,.pdf" onChange={handleFileChange} className="block w-full" />
        </div>
        <button type="submit" className="neo-btn bg-blue-600 text-white" disabled={loading}>
          {loading ? 'Verifying…' : 'Verify Documents'}
        </button>
      </form>

      {error && <div className="mt-4 text-red-600">Error: {error}</div>}

      {results && (
        <div className="mt-6 space-y-4">
          <h2 className="text-xl font-semibold">Verification Results</h2>
          {results.map((r, idx) => (
            <div key={idx} className="p-4 border rounded bg-gray-50">
              <p className="font-medium">File: {r.filename}</p>
              <p>Status: <span className={r.status === 'VERIFIED' ? 'text-green-600' : 'text-red-600'}>{r.status}</span></p>
              <p>Reason: {r.reason}</p>
              <details className="mt-2">
                <summary className="cursor-pointer underline">View Checks</summary>
                <ul className="list-disc pl-5 mt-2">
                  {r.checks.map((c, i) => (
                    <li key={i} className={c.passed ? 'text-green-700' : 'text-red-700'}>{c.name}: {c.passed ? 'PASS' : 'FAIL'} – {c.detail}</li>
                  ))}
                </ul>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
