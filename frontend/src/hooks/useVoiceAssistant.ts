import { useState, useCallback, useRef, useEffect } from 'react';

interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  lastCommand: string;
}

export interface VoiceAction {
  type: 'navigate' | 'fill' | 'search' | 'order' | 'cart' | 'filter' | 'help' | 'unknown';
  payload?: any;
}

export function useVoiceAssistant(navigate?: (path: string) => void, onAction?: (action: VoiceAction) => void) {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isSpeaking: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    isSupported: typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
    lastCommand: '',
  });

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(
    typeof window !== 'undefined' ? window.speechSynthesis : null
  );
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  // Speak text aloud in Hindi
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthRef.current) { resolve(); return; }
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      const voices = synthRef.current.getVoices();
      const hindiVoice = voices.find(v => v.lang.startsWith('hi'));
      if (hindiVoice) utterance.voice = hindiVoice;
      utterance.onend = () => { setState(s => ({ ...s, isSpeaking: false })); resolve(); };
      utterance.onerror = () => { setState(s => ({ ...s, isSpeaking: false })); resolve(); };
      setState(s => ({ ...s, isSpeaking: true }));
      synthRef.current.speak(utterance);
    });
  }, []);

  // Parse voice text into product form fields
  const parseProductVoice = useCallback((text: string) => {
    const lower = text.toLowerCase();
    const result: Record<string, any> = {};

    // Product name (Hindi + English)
    const productMap: Record<string, string> = {
      tamatar: 'Tomato', tomato: 'Tomato',
      aloo: 'Potato', potato: 'Potato',
      pyaaz: 'Onion', onion: 'Onion',
      gehu: 'Wheat', wheat: 'Wheat', kanak: 'Wheat',
      chawal: 'Rice', rice: 'Rice', basmati: 'Basmati Rice',
      doodh: 'Milk', milk: 'Milk',
      kela: 'Banana', banana: 'Banana',
      aam: 'Mango', mango: 'Mango',
      palak: 'Spinach', spinach: 'Spinach',
      gobhi: 'Cauliflower', cauliflower: 'Cauliflower',
      mirch: 'Green Chilli', chilli: 'Green Chilli',
      shimla: 'Capsicum', capsicum: 'Capsicum',
      gajar: 'Carrot', carrot: 'Carrot',
      brinjal: 'Brinjal', baingan: 'Brinjal',
      adrak: 'Ginger', ginger: 'Ginger',
      lehsun: 'Garlic', garlic: 'Garlic',
      haldi: 'Turmeric', turmeric: 'Turmeric',
      dhaniya: 'Coriander', coriander: 'Coriander',
      moong: 'Moong Dal', moongdal: 'Moong Dal',
      chana: 'Chana Dal', chanadal: 'Chana Dal',
      masoor: 'Masoor Dal', masoordal: 'Masoor Dal',
      makka: 'Corn', maize: 'Maize',
      ghee: 'Ghee', paneer: 'Paneer', curd: 'Curd',
      apple: 'Apple', angoor: 'Grapes',
    };

    for (const [hindi, english] of Object.entries(productMap)) {
      if (lower.includes(hindi)) { result.name = english; break; }
    }

    // Price
    const priceMatch = lower.match(/(\d+)\s*(rupaye|rs|₹|rupees|price|daam|kimat|bhaav)/);
    if (priceMatch) result.pricePerKg = priceMatch[1];
    // Also match "X rupaye kilo" or "X per kg"
    const priceMatch2 = lower.match(/(\d+)\s*(kilo|kg|per)/);
    if (!result.pricePerKg && priceMatch2) result.pricePerKg = priceMatch2[1];
    // Match "X bechna hai" pattern
    const priceMatch3 = lower.match(/(\d+)\s*bechna/);
    if (!result.pricePerKg && priceMatch3) result.pricePerKg = priceMatch3[1];

    // Quantity
    const qtyMatch = lower.match(/(\d+)\s*(kilo|kg|quintal|ton|unit|piece)/);
    if (qtyMatch) {
      let qty = parseInt(qtyMatch[1]);
      if (qtyMatch[2] === 'quintal') qty *= 100;
      if (qtyMatch[2] === 'ton') qty *= 1000;
      result.availableQuantity = String(qty);
    }
    // Also match "mere paas X hai" or "X hai mere paas"
    const qtyMatch2 = lower.match(/mere paas\s+(\d+)/);
    if (!result.availableQuantity && qtyMatch2) result.availableQuantity = qtyMatch2[1];

    // Grade
    if (lower.includes('grade a+') || lower.includes('a plus')) result.qualityGrade = 'A+';
    else if (lower.includes('grade a') || lower.includes('a grade')) result.qualityGrade = 'A';
    else if (lower.includes('grade b+') || lower.includes('b plus')) result.qualityGrade = 'B+';
    else if (lower.includes('grade b')) result.qualityGrade = 'B';

    // Organic
    if (lower.includes('organic') || lower.includes('jaivik') || lower.includes('prakritik')) result.organicCertified = true;

    // Cold chain
    if (lower.includes('cold chain') || lower.includes('thanda') || lower.includes('fridge')) result.coldChainRequired = true;

    // Category detection
    const catMap: Record<string, string> = {
      sabzi: 'Vegetables', vegetable: 'Vegetables',
      fruit: 'Fruits',
      anaaj: 'Grains', grain: 'Grains', cereal: 'Grains',
      daal: 'Pulses', pulse: 'Pulses', lentil: 'Pulses',
      masala: 'Spices', spice: 'Spices',
      doodh: 'Dairy', dairy: 'Dairy', milk: 'Dairy',
    };
    for (const [hindi, cat] of Object.entries(catMap)) {
      if (lower.includes(hindi)) { result.categoryId = cat; break; }
    }

    return result;
  }, []);

  // Parse order/quantity voice
  const parseOrderVoice = useCallback((text: string) => {
    const lower = text.toLowerCase();
    const result: Record<string, any> = {};

    const qtyMatch = lower.match(/(\d+)\s*(kilo|kg|quintal|piece)/);
    if (qtyMatch) {
      let qty = parseInt(qtyMatch[1]);
      if (qtyMatch[2] === 'quintal') qty *= 100;
      result.quantity = qty;
    }

    // Address
    const addrMatch = lower.match(/(deliver|pahunchao|bhejo|address|pata|location)\s*(to|at|pe|ko)?\s*(.+)/);
    if (addrMatch) result.address = addrMatch[3].trim();

    return result;
  }, []);

  // Main command processor
  const processCommand = useCallback(async (transcript: string) => {
    const text = transcript.toLowerCase().trim();
    const nav = navigateRef.current;
    const action = onActionRef.current;

    setState(s => ({ ...s, lastCommand: text }));

    // ═══════════════════════════════════════════════════════
    // ADD PRODUCT BY VOICE
    // ═══════════════════════════════════════════════════════
    if (text.match(/(naya|new|add|jod|upload|listing).*(product|maal|saman|item|utpad|bekna|bech)/i) ||
        text.match(/(product|maal).*(add|jod|bekna)/i) ||
        text.includes('product add') || text.includes('maal bech') || text.includes('naya product')) {
      const parsed = parseProductVoice(text);
      if (parsed.name && parsed.pricePerKg && parsed.availableQuantity) {
        // Full product info — fill form directly
        if (action) action({ type: 'fill', payload: { page: 'addProduct', fields: parsed } });
        await speak(`${parsed.name} ka product form bhar raha hoon. ${parsed.availableQuantity} kilo, ${parsed.pricePerKg} rupaye kilo.`);
        if (nav) nav('/farmer/products/add');
      } else if (parsed.name) {
        // Partial info — go to form and speak what we have
        if (action) action({ type: 'fill', payload: { page: 'addProduct', fields: parsed } });
        await speak(`${parsed.name} ka form khol raha hoon. Baaqi jaankari bol ke bhar sakte hain.`);
        if (nav) nav('/farmer/products/add');
      } else {
        await speak('Product ka naam aur daam bataiye. Jaise: Tamatar, 30 rupaye kilo, 500 kilo.');
        if (nav) nav('/farmer/products/add');
      }
      return;
    }

    // ═══════════════════════════════════════════════════════
    // PRODUCT NAME + PRICE (direct form fill)
    // ═══════════════════════════════════════════════════════
    const parsed = parseProductVoice(text);
    if (parsed.name && (parsed.pricePerKg || parsed.availableQuantity)) {
      if (action) action({ type: 'fill', payload: { page: 'addProduct', fields: parsed } });
      const parts = [parsed.name];
      if (parsed.pricePerKg) parts.push(`${parsed.pricePerKg} rupaye kilo`);
      if (parsed.availableQuantity) parts.push(`${parsed.availableQuantity} kilo`);
      await speak(`${parsed.name} ki jaankari mil gayi. ${parts.join(', ')}. Form bhar raha hoon.`);
      if (nav) nav('/farmer/products/add');
      return;
    }

    // ═══════════════════════════════════════════════════════
    // PRICE QUERIES
    // ═══════════════════════════════════════════════════════
    if (text.match(/(price|kimat|daam|rate|kitne|bhaav|kya hai)/i)) {
      if (parsed.name) {
        try {
          const res = await fetch(`/api/mandi/compare/${parsed.name}`);
          const data = await res.json();
          if (data.success && data.data.stats) {
            const s = data.data.stats;
            await speak(`${parsed.name} ki mandi mein average kimat ₹${s.avgModalPrice} hai. Range ₹${s.minPrice} se ₹${s.maxPrice} hai. ${s.marketsFound} mandi mein mil rahi hai.`);
          } else {
            await speak(`${parsed.name} ki abhi mandi mein kimat uplabdh nahi hai.`);
          }
        } catch {
          await speak(`${parsed.name} ki kimat abhi load ho rahi hai.`);
        }
      } else {
        await speak('Kis cheez ki kimat jaanni hai? Tamatar, aloo, pyaaz, ya kuch aur?');
      }
      return;
    }

    // ═══════════════════════════════════════════════════════
    // MY PRODUCTS / ORDERS
    // ═══════════════════════════════════════════════════════
    if (text.match(/(mere|mera|my).*(product|maal|saman|list)/i) || text.includes('mere product')) {
      await speak('Aapke saare products dikha raha hoon.');
      if (nav) nav('/farmer/products');
      return;
    }

    if (text.match(/(mere|mera|my).*(order|order)/i) || text.includes('mere order') || text.includes('orders dikhao')) {
      await speak('Aapke orders dikha raha hoon.');
      if (nav) nav('/farmer/orders');
      return;
    }

    // ═══════════════════════════════════════════════════════
    // DEMAND / HEATMAP
    // ═══════════════════════════════════════════════════════
    if (text.match(/(demand|maang|heatmap|kitni demand)/i)) {
      await speak('Demand heatmap khol raha hoon. Dekhein kahan zyada demand hai.');
      if (nav) nav('/farmer/demand-map');
      return;
    }

    // ═══════════════════════════════════════════════════════
    // HARVEST / FASAL
    // ═══════════════════════════════════════════════════════
    if (text.match(/(harvest|fasal|crop|katai)/i)) {
      await speak('Harvest management khol raha hoon.');
      if (nav) nav('/farmer/harvests');
      return;
    }

    // ═══════════════════════════════════════════════════════
    // ANALYTICS / EARNINGS / KAMAAI
    // ═══════════════════════════════════════════════════════
    if (text.match(/(analytics|kamaai|earnings|paisa|revenue|profit|kitna kamaya)/i)) {
      await speak('Aapki kamaai aur analytics dikha raha hoon.');
      if (nav) nav('/farmer/analytics');
      return;
    }

    // ═══════════════════════════════════════════════════════
    // MARKETPLACE / BAZAAR
    // ═══════════════════════════════════════════════════════
    if (text.match(/(marketplace|bazaar|khareed|buy|kharidna)/i)) {
      await speak('Marketplace khol raha hoon. Dekhein kya mil raha hai.');
      if (nav) nav('/consumer/marketplace');
      return;
    }

    // ═══════════════════════════════════════════════════════
    // ORDER CLUBBING
    // ═══════════════════════════════════════════════════════
    if (text.match(/(club|group|combine|sang|saath)/i)) {
      await speak('Order clubbing khol raha hoon. Dekhein kitni bachat ho sakti hai.');
      if (nav) nav('/farmer/clubbing');
      return;
    }

    // ═══════════════════════════════════════════════════════
    // GLOBAL TRADE / EXPORT
    // ═══════════════════════════════════════════════════════
    if (text.match(/(global|export|videsh|international)/i)) {
      await speak('Global trade marketplace khol raha hoon.');
      if (nav) nav('/global/marketplace');
      return;
    }

    // ═══════════════════════════════════════════════════════
    // MANDI PRICES
    // ═══════════════════════════════════════════════════════
    if (text.match(/(mandi|mandi price|mandi rate|apmc)/i)) {
      await speak('APMC mandi prices dikha raha hoon.');
      if (nav) nav('/farmer/mandi-prices');
      return;
    }

    // ═══════════════════════════════════════════════════════
    // PRICE ADVISOR
    // ═══════════════════════════════════════════════════════
    if (text.match(/(price advisor|price advice|kimat salah|daam salah)/i)) {
      await speak('AI Price Advisor khol raha hoon.');
      if (nav) nav('/farmer/price-advisor');
      return;
    }

    // ═══════════════════════════════════════════════════════
    // DASHBOARD / HOME
    // ═══════════════════════════════════════════════════════
    if (text.match(/(dashboard|home|ghar|mukhya)/i)) {
      await speak('Dashboard khol raha hoon.');
      if (nav) nav('/farmer/dashboard');
      return;
    }

    // ═══════════════════════════════════════════════════════
    // HELP
    // ═══════════════════════════════════════════════════════
    if (text.match(/(help|madad|sahayata|kya kar|kaise|commands)/i)) {
      await speak('Aap ye bol sakte hain: Tamatar ka daam kya hai? Naya product add karo. Mere orders dikhao. Demand dekho. Harvest manage karo. Kamaai dekho. Mandi prices dikhao. Global trade kholo. Help ke liye "help" bolein.');
      return;
    }

    // ═══════════════════════════════════════════════════════
    // SEARCH (fallback)
    // ═══════════════════════════════════════════════════════
    if (text.match(/(search|khojo|dhundho|find)/i)) {
      const searchTerm = text.replace(/(search|khojo|dhundho|find|for|ke liye)/gi, '').trim();
      if (searchTerm) {
        if (action) action({ type: 'search', payload: searchTerm });
        await speak(`${searchTerm} ke liye khoj raha hoon.`);
      } else {
        await speak('Kya khojna hai?');
      }
      return;
    }

    // ═══════════════════════════════════════════════════════
    // NO MATCH
    // ═══════════════════════════════════════════════════════
    await speak('Maaf kijiye, main samajh nahi paya. Dobara bolein ya "help" bolein saari commands jaanne ke liye.');
  }, [speak, parseProductVoice]);

  // Start listening
  const startListening = useCallback(() => {
    if (!state.isSupported) {
      setState(s => ({ ...s, error: 'Aapka browser voice support nahi karta. Chrome use karein.' }));
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setState(s => ({ ...s, isListening: true, error: null, transcript: '', interimTranscript: '' }));
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalTranscript += t;
          else interimTranscript += t;
        }
        setState(s => ({ ...s, transcript: finalTranscript || interimTranscript, interimTranscript }));
        if (finalTranscript) processCommand(finalTranscript);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          setState(s => ({ ...s, isListening: false, error: 'Kuch nahi suna. Dobara prayas karein.' }));
        } else if (event.error === 'not-allowed') {
          setState(s => ({ ...s, isListening: false, error: 'Microphone permission denied. Browser settings mein enable karein.' }));
        } else {
          setState(s => ({ ...s, isListening: false, error: `Voice error: ${event.error}` }));
        }
      };

      recognition.onend = () => {
        setState(s => ({ ...s, isListening: false }));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setState(s => ({ ...s, error: `Voice start failed: ${err.message}` }));
    }
  }, [state.isSupported, processCommand]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setState(s => ({ ...s, isListening: false }));
  }, []);

  const toggleListening = useCallback(() => {
    if (state.isListening) stopListening();
    else startListening();
  }, [state.isListening, startListening, stopListening]);

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    speak,
    parseProductVoice,
  };
}
