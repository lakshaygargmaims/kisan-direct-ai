import { useState } from 'react';
import { Users, Shield, CheckCircle, XCircle } from 'lucide-react';

const DEMO_USERS = [
  { id: '1', name: 'Rajesh Kumar', email: 'farmer@demo.com', role: 'FARMER', active: true, verified: true, created: '2024-01-01' },
  { id: '2', name: 'Priya Sharma', email: 'consumer@demo.com', role: 'CONSUMER', active: true, verified: true, created: '2024-01-02' },
  { id: '3', name: 'Hotel Fresh Picks', email: 'buyer@demo.com', role: 'B2B_BUYER', active: true, verified: true, created: '2024-01-03' },
  { id: '4', name: 'Green Valley FPO', email: 'fpo@demo.com', role: 'FPO', active: true, verified: true, created: '2024-01-04' },
  { id: '5', name: 'QuickDeliver Partners', email: 'logistics@demo.com', role: 'LOGISTICS', active: true, verified: true, created: '2024-01-05' },
  { id: '6', name: 'Suresh Singh', email: 'farmer2@demo.com', role: 'FARMER', active: true, verified: true, created: '2024-01-06' },
  { id: '7', name: 'Amit Patel', email: 'consumer2@demo.com', role: 'CONSUMER', active: false, verified: false, created: '2024-01-07' },
  { id: '8', name: 'Neha Gupta', email: 'consumer3@demo.com', role: 'CONSUMER', active: true, verified: true, created: '2024-01-08' },
];

const ROLE_COLORS: Record<string, string> = {
  FARMER: 'bg-green-100 text-green-700',
  CONSUMER: 'bg-blue-100 text-blue-700',
  'B2B_BUYER': 'bg-purple-100 text-purple-700',
  FPO: 'bg-amber-100 text-amber-700',
  LOGISTICS: 'bg-cyan-100 text-cyan-700',
  ADMIN: 'bg-red-100 text-red-700',
};

export default function UserManagement() {
  const [filter, setFilter] = useState('all');
  const users = filter === 'all' ? DEMO_USERS : DEMO_USERS.filter(u => u.role === filter);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Users className="h-6 w-6 text-green-600" />
        User Management
      </h1>

      <div className="flex flex-wrap gap-2">
        {['all', 'FARMER', 'CONSUMER', 'B2B_BUYER', 'FPO', 'LOGISTICS'].map(r => (
          <button key={r} onClick={() => setFilter(r)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              filter === r ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>{r === 'all' ? 'All' : r.replace(/_/g, ' ')}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Verified</th>
              <th className="text-left px-4 py-3 font-medium">Joined</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[u.role] || 'bg-gray-100'}`}>
                    {u.role.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1 text-xs ${u.active ? 'text-green-600' : 'text-red-600'}`}>
                    {u.active ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {u.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.verified ? <Shield className="h-4 w-4 text-green-500" /> : <span className="text-xs text-gray-400">No</span>}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{u.created}</td>
                <td className="px-4 py-3">
                  <button className="text-xs text-green-600 hover:underline">{u.active ? 'Deactivate' : 'Activate'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
