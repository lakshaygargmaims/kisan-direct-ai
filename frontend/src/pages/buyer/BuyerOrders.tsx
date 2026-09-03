import { Package } from 'lucide-react';

const DEMO_ORDERS = [
  { id: '#B001', product: 'Tomato', qty: 500, amount: '₹14,000', status: 'IN_TRANSIT', farmer: 'Rajesh Farm', date: '2024-01-15' },
  { id: '#B002', product: 'Onion', qty: 300, amount: '₹6,600', status: 'COMPLETED', farmer: 'Singh Agro', date: '2024-01-14' },
  { id: '#B003', product: 'Milk', qty: 50, amount: '₹2,750', status: 'PREPARING', farmer: 'Prasad Dairy', date: '2024-01-15' },
  { id: '#B004', product: 'Wheat', qty: 1000, amount: '₹25,000', status: 'FARMER_ACCEPTED', farmer: 'Patel Grain', date: '2024-01-13' },
];

export default function BuyerOrders() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Procurement Orders</h1>
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Order</th>
              <th className="text-left px-4 py-3 font-medium">Product</th>
              <th className="text-left px-4 py-3 font-medium">Farmer</th>
              <th className="text-left px-4 py-3 font-medium">Quantity</th>
              <th className="text-left px-4 py-3 font-medium">Amount</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {DEMO_ORDERS.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{o.id}</td>
                <td className="px-4 py-3">{o.product}</td>
                <td className="px-4 py-3 text-gray-500">{o.farmer}</td>
                <td className="px-4 py-3">{o.qty} kg</td>
                <td className="px-4 py-3 font-medium">{o.amount}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    o.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    o.status === 'IN_TRANSIT' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{o.status.replace(/_/g, ' ')}</span>
                </td>
                <td className="px-4 py-3 text-gray-400">{o.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
