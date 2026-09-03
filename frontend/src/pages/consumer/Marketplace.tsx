import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../../hooks/queries';
import { useTranslation } from 'react-i18next';
import { Search, Star, MapPin, Truck, Leaf, Grid, List } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'nearest', labelKey: 'consumer.marketplace.nearest' },
  { value: 'cheapest', labelKey: 'consumer.marketplace.cheapest' },
  { value: 'best_rated', labelKey: 'consumer.marketplace.bestRated' },
  { value: 'newest', labelKey: 'common.newest' },
];

export default function Marketplace() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('nearest');
  const [organic, setOrganic] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const CATEGORIES = [
    { key: 'All', label: t('common.all') },
    { key: 'Vegetables', label: t('landing.categories.vegetables') },
    { key: 'Fruits', label: t('landing.categories.fruits') },
    { key: 'Grains', label: t('landing.categories.grains') },
    { key: 'Pulses', label: t('landing.categories.pulses') },
    { key: 'Spices', label: t('landing.categories.spices') },
    { key: 'Dairy', label: t('landing.categories.dairy') },
    { key: 'Processed', label: 'Processed' },
  ];

  const params = useMemo(() => {
    const p: Record<string, string> = {
      limit: '20',
      sortBy,
      lat: '28.5245',
      lng: '77.2066',
    };
    if (appliedSearch) p.search = appliedSearch;
    if (category !== 'All') p.category = category;
    if (organic) p.organic = 'true';
    return p;
  }, [appliedSearch, category, sortBy, organic]);

  const { data, isLoading } = useProducts(params);
  const products = data?.products || [];
  const total = data?.total || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('consumer.marketplace.title')}</h1>
          <p className="text-gray-500">{total} {t('consumer.marketplace.productsFound')}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('consumer.marketplace.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <button type="submit" className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition">
            {t('common.search')}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setCategory(c.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  category === c.key ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="checkbox" checked={organic} onChange={e => setOrganic(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
              <Leaf className="h-4 w-4 text-green-600" />
              Organic
            </label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(o.labelKey)}</option>)}
            </select>
            <div className="flex border rounded-lg overflow-hidden">
              <button onClick={() => setView('grid')}
                className={`p-1.5 ${view === 'grid' ? 'bg-green-50 text-green-600' : 'text-gray-400'}`}>
                <Grid className="h-4 w-4" />
              </button>
              <button onClick={() => setView('list')}
                className={`p-1.5 ${view === 'list' ? 'bg-green-50 text-green-600' : 'text-gray-400'}`}>
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border shadow-sm p-4 animate-pulse">
              <div className="h-40 bg-gray-200 rounded-lg mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <Search className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-500">{t('common.noResults')}</h3>
          <p className="text-sm text-gray-400 mt-1">{t('common.filter')}</p>
        </div>
      ) : (
        <div className={view === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'space-y-3'
        }>
          {products.map((product: any) => (
            <Link key={product.id} to={`/consumer/products/${product.id}`}
              className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition overflow-hidden ${
                view === 'list' ? 'flex' : ''
              }`}>
              <div className={`${view === 'list' ? 'w-40 h-32' : 'h-44'} bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center overflow-hidden`}>
                <span className="text-5xl">{product.category?.icon || '🌿'}</span>
              </div>
              <div className="p-4 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.farmer?.name}</p>
                  </div>
                  {product.organicCertified && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Leaf className="h-3 w-3" /> Organic
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1.5 text-sm text-gray-500">
                  {product.distance != null && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{product.distance} {t('common.km')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                    <span>{Number(product.avgRating || 0).toFixed(1)}</span>
                    <span className="text-gray-300">•</span>
                    <span>Grade {product.qualityGrade}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5" />
                    <span>{product.availableQuantity} {product.unit || 'kg'} {t('common.available')}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-green-700">₹{product.pricePerKg}</span>
                    <span className="text-sm text-gray-400">/{product.unit || 'kg'}</span>
                  </div>
                  <span className="text-xs text-gray-400">{product.category?.name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
