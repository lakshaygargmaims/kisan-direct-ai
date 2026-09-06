import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Package, Edit, Trash2, Leaf, ExternalLink, Loader2 } from 'lucide-react';
import { useProducts } from '../../hooks/queries';
import { useAuthStore } from '../../store/auth';
import { api } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';

const CATEGORY_ICONS: Record<string, string> = {
  Vegetables: '🥬', Fruits: '🍎', Grains: '🌾', Pulses: '🫘',
  Spices: '🌶️', Dairy: '🧀', Processed: '📦', Other: '🌿',
};

export default function FarmerProducts() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const params: Record<string, string> = {};
  if (user?.id) params.farmerId = user.id;

  const { data, isLoading } = useProducts(params);
  const products = data?.products || [];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    try {
      await api.deleteProduct(deleteTarget.id);
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success(`${deleteTarget.name} has been deactivated`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete product');
    } finally {
      setDeleting(null);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('farmer.products.title')}</h1>
          <p className="text-gray-500">
            {isLoading ? '...' : `${products.length} ${t('consumer.marketplace.productsFound')}`}
          </p>
        </div>
        <Link to="/farmer/products/add"
          className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2">
          <Plus className="h-4 w-4" /> {t('farmer.products.addProduct')}
        </Link>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto" />
          <p className="mt-3 text-gray-500">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto" />
          <p className="mt-3 text-gray-500 font-medium">No products yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first product to start selling</p>
          <Link to="/farmer/products/add"
            className="mt-4 inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 transition">
            <Plus className="h-4 w-4" /> {t('farmer.products.addProduct')}
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t('nav.products')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('farmer.products.category')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('common.quantity')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('common.price')}/unit</th>
                <th className="text-left px-4 py-3 font-medium">{t('farmer.products.quality')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('common.status')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p: any) => {
                const catName = p.category?.name || 'Other';
                const icon = CATEGORY_ICONS[catName] || '🌿';
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{icon}</span>
                        <div>
                          <span className="font-medium">{p.name}</span>
                          {p.organicCertified && <Leaf className="inline h-3.5 w-3.5 text-green-500 ml-1" />}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{catName}</td>
                    <td className="px-4 py-3">{p.availableQuantity} {p.unit || 'kg'}</td>
                    <td className="px-4 py-3 font-medium">₹{p.pricePerKg}</td>
                    <td className="px-4 py-3">{p.qualityGrade}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {p.isActive ? t('common.active') : t('consumer.marketplace.outOfStock')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                        disabled={deleting === p.id}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded disabled:opacity-50 transition-colors"
                        title="Deactivate product">
                        {deleting === p.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Deactivate Product</h3>
                <p className="text-sm text-gray-500">This action can be undone later</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to deactivate <strong>"{deleteTarget.name}"</strong>? It will be hidden from the marketplace but you can reactivate it later.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting === deleteTarget.id}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting === deleteTarget.id}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                {deleting === deleteTarget.id ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Deactivating...</>
                ) : (
                  <><Trash2 className="h-4 w-4" /> Deactivate</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
