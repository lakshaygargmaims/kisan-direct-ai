import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageLoader() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Brief delay to show the loader on navigation
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200]">
      <div className="h-0.5 bg-green-100">
        <div className="h-full bg-green-500 animate-[slide_0.3s_ease-in-out]" style={{
          animation: 'slide 0.3s ease-in-out'
        }} />
      </div>
      <style>{`
        @keyframes slide {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
