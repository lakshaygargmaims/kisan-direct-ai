import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { Mic, MicOff, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const CATEGORIES = ['Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Dairy', 'Processed', 'Other'];
const GRADES = ['A+', 'A', 'B+', 'B', 'C', 'D'];

export default function AddProduct() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', categoryId: '', pricePerKg: '', availableQuantity: '', minOrderQuantity: '1',
    qualityGrade: 'A', organicCertified: false, harvestDate: '', shelfLife: '',
    storageRequirement: '', coldChainRequired: false,
    deliveryRadius: '50', interstateAllowed: false, maxTransitHours: '24',
  });
  const [saving, setSaving] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [parsed, setParsed] = useState<any>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const update = (field: string, value: any) => setForm({ ...form, [field]: value });

  const parseVoiceText = useCallback((text: string) => {
    const lower = text.toLowerCase();
    const result: Record<string, any> = {};

    // Product name
    const productMap: Record<string, string> = {
      tamatar: 'Tomato', tomato: 'Tomato', aloo: 'Potato', potato: 'Potato',
      pyaaz: 'Onion', onion: 'Onion', gehu: 'Wheat', wheat: 'Wheat',
      chawal: 'Rice', rice: 'Rice', basmati: 'Basmati Rice',
      palak: 'Spinach', spinach: 'Spinach', gobhi: 'Cauliflower', cauliflower: 'Cauliflower',
      mirch: 'Green Chilli', shimla: 'Capsicum', capsicum: 'Capsicum',
      gajar: 'Carrot', carrot: 'Carrot', brinjal: 'Brinjal', baingan: 'Brinjal',
      adrak: 'Ginger', ginger: 'Ginger', lehsun: 'Garlic', garlic: 'Garlic',
      haldi: 'Turmeric', turmeric: 'Turmeric', dhaniya: 'Coriander', coriander: 'Coriander',
      moong: 'Moong Dal', chana: 'Chana Dal', makka: 'Corn', corn: 'Corn',
      apple: 'Apple', apples: 'Apple', kela: 'Banana', banana: 'Banana', aam: 'Mango', mango: 'Mango',
      doodh: 'Milk', milk: 'Milk', ghee: 'Ghee', paneer: 'Paneer',
    };
    for (const [hindi, english] of Object.entries(productMap)) {
      if (lower.includes(hindi)) { result.name = english; break; }
    }

    // Price
    const pm1 = lower.match(/(\d+)\s*(rupaye|rs|₹|rupees|price|daam|kimat|bechna)/);
    if (pm1) result.pricePerKg = pm1[1];
    const pm2 = lower.match(/(\d+)\s*(kilo|kg)/);
    if (!result.pricePerKg && pm2) result.pricePerKg = pm2[1];
    const pm3 = lower.match(/(\d+)\s*bechna/);
    if (!result.pricePerKg && pm3) result.pricePerKg = pm3[1];

    // Quantity
    const qm1 = lower.match(/(\d+)\s*(kilo|kg|quintal)/);
    if (qm1) {
      let qty = parseInt(qm1[1]);
      if (qm1[2] === 'quintal') qty *= 100;
      result.availableQuantity = String(qty);
    }
    const qm2 = lower.match(/mere paas\s+(\d+)/);
    if (!result.availableQuantity && qm2) result.availableQuantity = qm2[1];

    // Grade
    if (lower.includes('grade a+') || lower.includes('a plus')) result.qualityGrade = 'A+';
    else if (lower.includes('grade a') || lower.includes('a grade')) result.qualityGrade = 'A';
    else if (lower.includes('grade b+') || lower.includes('b plus')) result.qualityGrade = 'B+';
    else if (lower.includes('grade b')) result.qualityGrade = 'B';

    // Organic
    if (lower.includes('organic') || lower.includes('jaivik') || lower.includes('prakritik')) result.organicCertified = true;

    // Cold chain
    if (lower.includes('cold chain') || lower.includes('thanda') || lower.includes('fridge')) result.coldChainRequired = true;

    return result;
  }, []);

  const handleVoice = () => {
    if (voiceMode && recognitionRef.current) {
      recognitionRef.current.stop();
      setVoiceMode(false);
      return;
    }

    setVoiceMode(true);
    setVoiceText('');
    setParsed(null);
    setVoiceError(null);

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let final = '';
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += t;
          else interim += t;
        }
        setVoiceText(final || interim);
        if (final) {
          const p = parseVoiceText(final);
          setParsed(p);
          if (p.name) update('name', p.name);
          if (p.pricePerKg) update('pricePerKg', p.pricePerKg);
          if (p.availableQuantity) update('availableQuantity', p.availableQuantity);
          if (p.qualityGrade) update('qualityGrade', p.qualityGrade);
          if (p.organicCertified) update('organicCertified', true);
          if (p.coldChainRequired) update('coldChainRequired', true);
          // Speak confirmation
          const synth = window.speechSynthesis;
          if (synth) {
            synth.cancel();
            const parts = [p.name || ''];
            if (p.availableQuantity) parts.push(p.availableQuantity + ' kilo');
            if (p.pricePerKg) parts.push(p.pricePerKg + ' rupaye kilo');
            const msg = new SpeechSynthesisUtterance(`${p.name || 'Product'} ki jaankari mil gayi. ${parts.join(', ')}.`);
            msg.lang = 'hi-IN';
            msg.rate = 0.9;
            synth.speak(msg);
          }
        }
      };

      recognition.onerror = (event: any) => {
        setVoiceMode(false);
        if (event.error === 'no-speech') setVoiceError('Kuch nahi suna. Dobara bolein.');
        else if (event.error === 'not-allowed') setVoiceError('Microphone permission deni padegi.');
        else setVoiceError('Voice error: ' + event.error);
      };

      recognition.onend = () => setVoiceMode(false);
      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      setVoiceMode(false);
      setVoiceError('Voice support nahi hai. Chrome use karein.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Create the product first
      const product = await api.createProduct({
        name: form.name,
        pricePerKg: Number(form.pricePerKg),
        availableQuantity: Number(form.availableQuantity),
        minOrderQuantity: Number(form.minOrderQuantity),
        qualityGrade: form.qualityGrade,
        organicCertified: form.organicCertified,
        harvestDate: form.harvestDate || undefined,
        shelfLife: form.shelfLife ? Number(form.shelfLife) : undefined,
        storageRequirement: form.storageRequirement || undefined,
        coldChainRequired: form.coldChainRequired,
        categoryId: form.categoryId,
        deliveryRule: {
          deliveryMode: 'PLATFORM',
          maxDeliveryRadiusKm: Number(form.deliveryRadius),
          interstateAllowed: form.interstateAllowed,
          coldChainRequired: form.coldChainRequired,
          maximumTransitHours: Number(form.maxTransitHours),
        },
      });

      toast.success('Product added!');

      navigate('/farmer/products');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add product');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/farmer/products" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600">
        <ArrowLeft className="h-4 w-4" /> {t('common.back')} {t('farmer.products.title')}
      </Link>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6">{t('farmer.products.addProduct')}</h1>

        {/* Voice Input */}
        <div className="bg-green-50 rounded-xl p-4 mb-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-800">🎤 {t('farmer.products.voiceAdd')}</h3>
              <p className="text-sm text-green-600">{t('farmer.products.voicePlaceholder')}</p>
            </div>
            <button type="button" onClick={handleVoice}
              className={`p-3 rounded-full transition ${voiceMode ? 'bg-red-500 text-white animate-pulse' : 'bg-green-600 text-white hover:bg-green-700'}`}>
              {voiceMode ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          </div>
          {voiceText && (
            <div className="mt-3 bg-white rounded-lg p-3 text-sm">
              <p className="text-gray-500">{voiceMode ? '🎤 Sun raha hoon...' : 'Sunaa:'}</p>
              <p className="font-medium">"{voiceText}"</p>
              {parsed && (
                <div className="mt-2 text-green-700 space-y-1">
                  {parsed.name && <p>✅ Naam: {parsed.name}</p>}
                  {parsed.pricePerKg && <p>✅ Daam: ₹{parsed.pricePerKg}/kg</p>}
                  {parsed.availableQuantity && <p>✅ Matra: {parsed.availableQuantity} kg</p>}
                  {parsed.qualityGrade && <p>✅ Grade: {parsed.qualityGrade}</p>}
                  {parsed.organicCertified && <p>✅ Organic certified</p>}
                  <p className="text-green-600 font-medium">Form bhar diya hai. Submit karein ya aur bolein.</p>
                </div>
              )}
            </div>
          )}
          {voiceError && (
            <div className="mt-3 bg-red-50 rounded-lg p-3 text-sm text-red-700">
              ⚠️ {voiceError}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('farmer.products.productName')} *</label>
              <input type="text" value={form.name} onChange={e => update('name', e.target.value)} required
                className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500" placeholder="e.g., Tomato" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('farmer.products.category')} *</label>
              <select value={form.categoryId} onChange={e => update('categoryId', e.target.value)} required
                className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500">
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('farmer.products.pricePerKg')} *</label>
              <input type="number" value={form.pricePerKg} onChange={e => update('pricePerKg', e.target.value)} required
                className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('farmer.products.quantity')} *</label>
              <input type="number" value={form.availableQuantity} onChange={e => update('availableQuantity', e.target.value)} required
                className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('farmer.products.minOrder')}</label>
              <input type="number" value={form.minOrderQuantity} onChange={e => update('minOrderQuantity', e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('farmer.products.quality')}</label>
              <select value={form.qualityGrade} onChange={e => update('qualityGrade', e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500">
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('farmer.products.harvestDate')}</label>
              <input type="date" value={form.harvestDate} onChange={e => update('harvestDate', e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('farmer.products.shelfLife')}</label>
              <input type="number" value={form.shelfLife} onChange={e => update('shelfLife', e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.organicCertified} onChange={e => update('organicCertified', e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
              Organic Certified
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.coldChainRequired} onChange={e => update('coldChainRequired', e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
              {t('consumer.productDetail.coldChain')}
            </label>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">{t('nav.deliveryRules')}</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('farmer.products.deliveryRadius')}</label>
                <input type="number" value={form.deliveryRadius} onChange={e => update('deliveryRadius', e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('consumer.productDetail.estimatedDelivery')}</label>
                <input type="number" value={form.maxTransitHours} onChange={e => update('maxTransitHours', e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500" />
              </div>
              <label className="flex items-center gap-2 text-sm pt-6">
                <input type="checkbox" checked={form.interstateAllowed} onChange={e => update('interstateAllowed', e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                {t('farmer.products.interstate')}
              </label>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
            <Save className="h-5 w-5" />
            {saving ? '...' : t('farmer.products.addProduct')}
          </button>
        </form>
      </div>
    </div>
  );
}
