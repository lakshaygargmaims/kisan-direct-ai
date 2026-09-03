import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sprout, ArrowRight, MapPin, TrendingUp, Shield, Truck, Users, Zap,
  BarChart3, ShoppingCart, Clock, Star, CheckCircle, ChevronRight,
  Package, DollarSign, Globe, Leaf
} from 'lucide-react';

export default function LandingPage() {
  const { t } = useTranslation();

  const STATS = [
    { label: t('landing.stats.farmersConnected'), value: '2,500+', icon: Users },
    { label: t('landing.stats.productsListed'), value: '10,000+', icon: Package },
    { label: t('landing.stats.logisticsSavings'), value: '₹19L+', icon: DollarSign },
    { label: t('landing.stats.citiesCovered'), value: '50+', icon: Globe },
  ];

  const FEATURES = [
    { icon: MapPin, title: t('landing.features.nearbyFarmers'), desc: t('landing.features.nearbyFarmersDesc'), color: 'bg-blue-50 text-blue-600' },
    { icon: Zap, title: t('landing.features.aiPrice'), desc: t('landing.features.aiPriceDesc'), color: 'bg-amber-50 text-amber-600' },
    { icon: TrendingUp, title: t('landing.features.clubbing'), desc: t('landing.features.clubbingDesc'), color: 'bg-purple-50 text-purple-600' },
    { icon: Truck, title: t('landing.features.geoLogistics'), desc: t('landing.features.geoLogisticsDesc'), color: 'bg-green-50 text-green-600' },
    { icon: Shield, title: t('landing.features.securePay'), desc: t('landing.features.securePayDesc'), color: 'bg-red-50 text-red-600' },
    { icon: BarChart3, title: t('landing.features.analytics'), desc: t('landing.features.analyticsDesc'), color: 'bg-indigo-50 text-indigo-600' },
  ];

  const HOW_IT_WORKS = [
    { step: '1', title: t('landing.howItWorks.step1Title'), desc: t('landing.howItWorks.step1Desc'), icon: ShoppingCart },
    { step: '2', title: t('landing.howItWorks.step2Title'), desc: t('landing.howItWorks.step2Desc'), icon: Shield },
    { step: '3', title: t('landing.howItWorks.step3Title'), desc: t('landing.howItWorks.step3Desc'), icon: Truck },
    { step: '4', title: t('landing.howItWorks.step4Title'), desc: t('landing.howItWorks.step4Desc'), icon: CheckCircle },
  ];

  const TESTIMONIALS = [
    { name: t('landing.testimonials.farmer1Name'), role: t('landing.testimonials.farmer1Role'), text: t('landing.testimonials.farmer1'), rating: 5 },
    { name: t('landing.testimonials.consumer1Name'), role: t('landing.testimonials.consumer1Role'), text: t('landing.testimonials.consumer1'), rating: 5 },
    { name: t('landing.testimonials.buyer1Name'), role: t('landing.testimonials.buyer1Role'), text: t('landing.testimonials.buyer1'), rating: 5 },
  ];

  const CATEGORIES = [
    { key: 'vegetables', emoji: '🥬', count: '200+' },
    { key: 'fruits', emoji: '🍎', count: '150+' },
    { key: 'grains', emoji: '🌾', count: '80+' },
    { key: 'dairy', emoji: '🥛', count: '50+' },
    { key: 'spices', emoji: '🌶️', count: '100+' },
    { key: 'pulses', emoji: '🫘', count: '70+' },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-800/50 border border-green-600/30 rounded-full px-4 py-1.5 text-sm mb-6">
                <Leaf className="h-4 w-4" />
                {t('landing.hero.badge')}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                {t('landing.hero.title1')}{' '}
                <span className="text-green-300">{t('landing.hero.title2')}</span>{' '}
                <span className="text-emerald-300">{t('landing.hero.title3')}</span>{' '}
                <span className="text-yellow-300">{t('landing.hero.title4')}</span>
              </h1>
              <p className="text-lg text-green-100 mb-8 max-w-xl">
                {t('landing.hero.subtitle')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="bg-white text-green-800 px-6 py-3 rounded-xl font-semibold hover:bg-green-50 transition flex items-center gap-2">
                  {t('landing.hero.getStarted')} <ArrowRight className="h-5 w-5" />
                </Link>
                <Link to="/login" className="border border-green-400 text-green-300 px-6 py-3 rounded-xl font-semibold hover:bg-green-800 transition">
                  {t('landing.hero.demoLogin')}
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-4 text-sm text-green-200">
                <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4" /> {t('landing.hero.noMiddlemen')}</span>
                <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4" /> {t('landing.hero.aiPricing')}</span>
                <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4" /> {t('landing.hero.securePayments')}</span>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Farmer Earnings', value: '+30%', trend: 'up' },
                    { label: 'Consumer Price', value: '-20%', trend: 'down' },
                    { label: 'Logistics Cost', value: '-40%', trend: 'down' },
                    { label: 'Order Fulfillment', value: '95%', trend: 'up' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                      <p className="text-sm text-green-200">{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.trend === 'up' ? 'text-green-300' : 'text-yellow-300'}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-white/10 rounded-xl p-4">
                  <p className="text-sm text-green-200 mb-2">AI Price Intelligence</p>
                  <div className="space-y-2">
                    {[
                      { product: 'Tomato', fair: '₹28/kg', trend: '↑' },
                      { product: 'Onion', fair: '₹22/kg', trend: '↓' },
                      { product: 'Milk', fair: '₹55/L', trend: '→' },
                    ].map((p) => (
                      <div key={p.product} className="flex justify-between items-center text-sm">
                        <span>{p.product}</span>
                        <span className="font-medium">{p.fair} <span className="text-lg">{p.trend}</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-12 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <Icon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">{t('landing.categories.title')}</h2>
          <p className="text-gray-500 text-center mb-10">{t('landing.categories.subtitle')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => (
              <Link to="/consumer/marketplace" key={cat.key}
                className="bg-white rounded-xl p-4 text-center hover:shadow-lg transition border hover:border-green-200">
                <span className="text-3xl">{cat.emoji}</span>
                <p className="font-medium mt-2">{t(`landing.categories.${cat.key}`)}</p>
                <p className="text-xs text-gray-400">{cat.count} {t('landing.categories.products')}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">{t('landing.howItWorks.title')}</h2>
          <p className="text-gray-500 text-center mb-12">{t('landing.howItWorks.subtitle')}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="text-center relative">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-7 w-7 text-green-600" />
                  </div>
                  <span className="absolute top-0 right-0 lg:right-4 text-5xl font-bold text-green-100">{step.step}</span>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">{t('landing.features.title')}</h2>
          <p className="text-gray-500 text-center mb-12">{t('landing.features.subtitle')}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition border">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${f.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Order Clubbing Feature */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 lg:p-12 text-white">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">{t('landing.clubbingFeature.title')}</h2>
                <p className="text-purple-100 mb-6">
                  {t('landing.clubbingFeature.desc')}
                </p>
                <div className="space-y-3">
                  {[t('landing.clubbingFeature.ordersClubbed'), t('landing.clubbingFeature.savedOnLogistics'), t('landing.clubbingFeature.deliveryReduction'), t('landing.clubbingFeature.routePlanning')].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('landing.clubbingFeature.separateDeliveries')}</span>
                    <span className="line-through text-purple-300">₹510</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('landing.clubbingFeature.clubbedDelivery')}</span>
                    <span className="text-2xl font-bold">₹320</span>
                  </div>
                  <div className="bg-green-500/20 rounded-lg p-3 text-center">
                    <p className="text-sm">{t('landing.clubbingFeature.youSave')}</p>
                    <p className="text-3xl font-bold text-green-300">₹190</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('landing.testimonials.title')}</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((tItem) => (
              <div key={tItem.name} className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex gap-1 mb-3">
                  {Array(tItem.rating).fill(0).map((_, i) => <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-sm text-gray-600 mb-4">"{tItem.text}"</p>
                <div>
                  <p className="font-medium">{tItem.name}</p>
                  <p className="text-sm text-gray-400">{tItem.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-green-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('landing.cta.title')}</h2>
          <p className="text-green-100 mb-8 text-lg">{t('landing.cta.subtitle')}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="bg-white text-green-700 px-8 py-3 rounded-xl font-semibold hover:bg-green-50 transition">
              {t('landing.cta.startFree')}
            </Link>
            <Link to="/login" className="border border-green-300 px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition">
              {t('landing.cta.demoAccounts')}
            </Link>
          </div>
          <p className="mt-6 text-sm text-green-200">{t('landing.cta.demoPassword')}</p>
        </div>
      </section>
    </div>
  );
}
