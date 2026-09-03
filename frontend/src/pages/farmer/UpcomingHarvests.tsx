import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { toast } from 'sonner';
import {
  Sprout, Plus, Calendar, Package, TrendingUp, Users, Clock,
  AlertTriangle, CheckCircle2, Loader2, ChevronRight, Leaf,
  BarChart3, Truck, Brain
} from 'lucide-react';

function DaysRemaining({ date }: { date: string }) {
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  if (days < 0) return <span className="text-red-600 font-medium">{Math.abs(days)} days overdue</span>;
  if (days === 0) return <span className="text-orange-600 font-medium">Today!</span>;
  if (days <= 3) return <span className="text-orange-600 font-medium">{days} days left</span>;
  return <span className="text-gray-600">{days} days left</span>;
}

function ProgressRing({ percent }: { percent: number }) {
  const r = 40, c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  const color = percent >= 90 ? '#dc2626' : percent >= 60 ? '#eab308' : '#16a34a';
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 50 50)" className="transition-all duration-500" />
      </svg>
      <div className="absolute text-center">
        <p className="text-xl font-bold" style={{ color }}>{percent}%</p>
        <p className="text-[10px] text-gray-500">Reserved</p>
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  BOOKING_OPEN: 'bg-green-100 text-green-700',
  BOOKING_CLOSED: 'bg-yellow-100 text-yellow-700',
  HARVEST_PENDING: 'bg-blue-100 text-blue-700',
  HARVEST_CONFIRMED: 'bg-purple-100 text-purple-700',
  DELAYED: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function UpcomingHarvests() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['harvests', user?.id],
    queryFn: () => api.getHarvests({ farmerId: user!.id, limit: '50' }),
    enabled: !!user?.id,
  });

  const harvests = data?.harvests || [];

  const totalReserved = harvests.reduce((s: number, h: any) => s + (h.totalReservedQuantity || 0), 0);
  const totalExpected = harvests.reduce((s: number, h: any) => s + (h.expectedQuantity || 0), 0);
  const totalBookings = harvests.reduce((s: number, h: any) => s + (h._count?.reservations || 0), 0);
  const openCount = harvests.filter((h: any) => h.status === 'BOOKING_OPEN').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sprout className="h-6 w-6 text-green-600" /> Upcoming Harvests
          </h1>
          <p className="text-gray-500">{harvests.length} harvests • {openCount} booking open</p>
        </div>
        <Link to="/farmer/harvests/add"
          className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Upcoming Harvest
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Package, label: 'Total Expected', value: `${totalExpected.toLocaleString()} kg`, color: 'text-green-600' },
          { icon: TrendingUp, label: 'Total Reserved', value: `${totalReserved.toLocaleString()} kg`, color: 'text-blue-600' },
          { icon: Users, label: 'Advance Bookings', value: totalBookings, color: 'text-purple-600' },
          { icon: Clock, label: 'Booking Open', value: openCount, color: 'text-orange-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border p-4">
            <Icon className={`h-5 w-5 ${color} mb-2`} />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Harvest Cards */}
      {harvests.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
          <Sprout className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-500">No upcoming harvests</p>
          <p className="text-sm text-gray-400 mt-1">List your expected harvest and let buyers reserve in advance</p>
          <Link to="/farmer/harvests/add"
            className="mt-4 inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 transition">
            <Plus className="h-4 w-4" /> Add Upcoming Harvest
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {harvests.map((harvest: any) => {
            const reservedPct = harvest.expectedQuantity > 0
              ? Math.round((harvest.totalReservedQuantity / harvest.expectedQuantity) * 100) : 0;
            const revenue = harvest.totalReservedQuantity * harvest.expectedPricePerUnit;
            const advanceReceived = revenue * (harvest.advancePercentage / 100);

            return (
              <div key={harvest.id} className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Left: Product Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[harvest.status] || 'bg-gray-100'}`}>
                        {harvest.status.replace(/_/g, ' ')}
                      </span>
                      {harvest.coldChainRequired && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">❄️ Cold Chain</span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold mt-1">{harvest.productName}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{harvest.description}</p>

                    <div className="flex flex-wrap gap-4 mt-3 text-sm">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-gray-400" />
                        Harvest: {new Date(harvest.expectedHarvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <DaysRemaining date={harvest.expectedHarvestDate} />
                      <span className="text-gray-500">•</span>
                      <span className="font-medium text-green-700">₹{harvest.expectedPricePerUnit}/{harvest.unit}</span>
                      <span className="text-gray-500">•</span>
                      <span>{harvest.deliveryRadiusKm} km radius</span>
                    </div>
                  </div>

                  {/* Center: Progress */}
                  <div className="flex items-center gap-6">
                    <ProgressRing percent={reservedPct} />
                    <div className="text-sm space-y-1">
                      <div><span className="text-gray-500">Expected:</span> <span className="font-medium">{harvest.expectedQuantity} {harvest.unit}</span></div>
                      <div><span className="text-gray-500">Reserved:</span> <span className="font-medium text-blue-600">{harvest.totalReservedQuantity} {harvest.unit}</span></div>
                      <div><span className="text-gray-500">Remaining:</span> <span className="font-medium">{harvest.expectedQuantity - harvest.totalReservedQuantity} {harvest.unit}</span></div>
                      <div><span className="text-gray-500">Bookings:</span> <span className="font-medium">{harvest._count?.reservations || 0}</span></div>
                    </div>
                  </div>

                  {/* Right: Revenue & Actions */}
                  <div className="text-right space-y-2 shrink-0">
                    <div>
                      <p className="text-xs text-gray-500">Expected Revenue</p>
                      <p className="font-bold text-green-700">₹{revenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Advance Received</p>
                      <p className="font-bold text-blue-700">₹{advanceReceived.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2 justify-end mt-3">
                      {harvest.status === 'BOOKING_OPEN' && (
                        <button
                          onClick={() => window.location.href = `/farmer/harvests/${harvest.id}/confirm`}
                          className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition">
                          Confirm Harvest
                        </button>
                      )}
                      <Link to={`/farmer/harvests/${harvest.id}`}
                        className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition flex items-center gap-1">
                        Details <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>

                {harvest.status === 'DELAYED' && harvest.newExpectedDate && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2 text-sm text-orange-800">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Harvest delayed — new expected date: {new Date(harvest.newExpectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {harvest.delays?.[0] && ` • Reason: ${harvest.delays[0].reason}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
