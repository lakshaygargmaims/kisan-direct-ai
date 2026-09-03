import { Package } from 'lucide-react';

const DEMO_ORDERS = [
  { id: '#101', buyer: 'Hotel Fresh Picks', farmer: 'Rajesh Farm', product: 'Tomato', qty: 200, amount: '₹5,600', status: 'COMPLETED', date: '2024-01-15' },
  { id: '#102', buyer: 'Fresh Mart Retail', farmer: 'Rajesh Farm', product: 'Onion', qty: 250, amount: '₹5,500', status: 'IN_TRANSIT', date: '2024-01-15' },
  { id: '#103', buyer: 'Spice Kitchen', farmer: 'Rajesh Farm', product: 'Tomato', qty: 150, amount: '₹4,200', status: 'ADVANCE_PAID', date: '2024-01-15' },
  { id: '#104', buyer: 'Grand Plaza Hotel', farmer: 'Singh Agro', product: 'Wheat', qty: 500, amount: '₹12,500', status: 'FARMER_ACCEPTED', date: '2024-01-14' },
  { id: '#105', buyer: 'Priya Sharma', farmer: 'Prasad Dairy', product: 'Milk', qty: 10, amount: '₹550', status: 'COMPLETED', date: '2024-01-14' },
  { id: '#106', buyer: 'Amit Patel', farmer: 'Green Valley', product: 'Spinach', qty: 5, amount: '₹100', status: 'CANCELLED', date: '2024-01-13' },
];

export default function OrderManagement() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Order Management</h1>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: '50', color: 'text-gray-700' },
          { label: 'Active', value: '12', color: 'text-blue-600' },
          { label: 'Completed', value: '35', color: 'text-green-600' },
          { label: 'Cancelled', value: '3', color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border shadow-sm text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Order</th>
              <th className="text-left px-4 py-3 font-medium">Buyer</th>
              <th className="text-left px-4 py-3 font-medium">Farmer</th>
              <th className="text-left px-4 py-3 font-medium">Product</th>
              <th className="text-left px-4 py-3 font-medium">Amount</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {DEMO_ORDERS.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{o.id}</td>
                <td className="px-4 py-3 text-gray-500">{o.buyer}</td>
                <td className="px-4 py-3 text-gray-500">{o.farmer}</td>
                <td className="px-4 py-3">{o.product} • {o.qty} kg</td>
                <td className="px-4 py-3 font-medium">{o.amount}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    o.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    o.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    o.status === 'IN_TRANSIT' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{o.status.replace(/_/g, ' ')}</span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{o.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
