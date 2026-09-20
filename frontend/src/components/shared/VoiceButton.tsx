import { useState, useEffect } from 'react';
import { useVoiceAssistant, VoiceAction } from '../../hooks/useVoiceAssistant';
import { useNavigate } from 'react-router-dom';

interface VoiceButtonProps {
  position?: 'bottom-right' | 'bottom-left';
  onAction?: (action: VoiceAction) => void;
}

export function VoiceButton({ position = 'bottom-right', onAction }: VoiceButtonProps) {
  const navigate = useNavigate();
  const voice = useVoiceAssistant(navigate, onAction);
  const [showHelp, setShowHelp] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const posStyle = position === 'bottom-right'
    ? { bottom: '24px', right: '24px' }
    : { bottom: '24px', left: '24px' };

  // Show action feedback
  useEffect(() => {
    if (voice.lastCommand) {
      setActionFeedback(`✅ Command: "${voice.lastCommand}"`);
      const timer = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [voice.lastCommand]);

  if (!voice.isSupported) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={voice.toggleListening}
        style={{
          position: 'fixed',
          ...posStyle,
          zIndex: 9999,
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: voice.isListening
            ? '0 0 0 4px rgba(239, 68, 68, 0.3), 0 4px 20px rgba(239, 68, 68, 0.4)'
            : voice.isSpeaking
              ? '0 0 0 4px rgba(59, 130, 246, 0.3), 0 4px 20px rgba(59, 130, 246, 0.4)'
              : '0 4px 20px rgba(0,0,0,0.3)',
          background: voice.isListening
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : voice.isSpeaking
              ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
              : 'linear-gradient(135deg, #16a34a, #15803d)',
          transition: 'all 0.3s ease',
          animation: voice.isListening ? 'pulse-voice 1.5s infinite' : 'none',
        }}
        title={voice.isListening ? 'Band karein (Stop)' : 'Bol ke madad lein (Voice Help)'}
      >
        {voice.isListening ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : voice.isSpeaking ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
            <line x1="12" y1="19" x2="12" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="23" x2="16" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Help toggle */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        style={{
          position: 'fixed',
          bottom: '96px',
          right: '24px',
          zIndex: 9999,
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '2px solid #e5e7eb',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'white',
          fontSize: '16px',
          fontWeight: 700,
          color: '#6b7280',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
        title="Voice commands ki list"
      >
        ?
      </button>

      {/* Listening panel */}
      {voice.isListening && (
        <div style={{
          position: 'fixed',
          bottom: '140px',
          right: '16px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          color: 'white',
          borderRadius: '16px',
          padding: '16px 20px',
          maxWidth: '320px',
          minWidth: '260px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: '#ef4444', animation: 'blink 1s infinite',
            }} />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>🎤 Sun raha hoon...</span>
          </div>
          {voice.interimTranscript && (
            <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px', marginBottom: '6px' }}>
              "{voice.interimTranscript}"
            </div>
          )}
          {voice.transcript && (
            <div style={{ color: '#22c55e', fontWeight: 500, fontSize: '14px', marginBottom: '6px' }}>
              ✅ "{voice.transcript}"
            </div>
          )}
          <div style={{ color: '#64748b', fontSize: '11px', lineHeight: '1.5' }}>
            Bol ke bolein:<br/>
            • "Tamatar, 30 rupaye, 500 kilo"<br/>
            • "Naya product add karo"<br/>
            • "Tamatar ka daam kya hai?"<br/>
            • "Mere orders dikhao"<br/>
            • "Demand dekho"
          </div>
        </div>
      )}

      {/* Speaking indicator */}
      {voice.isSpeaking && !voice.isListening && (
        <div style={{
          position: 'fixed',
          bottom: '140px',
          right: '16px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #1e40af, #1d4ed8)',
          color: 'white',
          borderRadius: '16px',
          padding: '12px 16px',
          maxWidth: '300px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          fontSize: '13px',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="white" strokeWidth="2" fill="none" />
            </svg>
            <span>Bol raha hoon...</span>
          </div>
        </div>
      )}

      {/* Action feedback */}
      {actionFeedback && (
        <div style={{
          position: 'fixed',
          bottom: '140px',
          right: '16px',
          zIndex: 9999,
          background: '#065f46',
          color: 'white',
          borderRadius: '12px',
          padding: '10px 16px',
          maxWidth: '300px',
          fontSize: '13px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          animation: 'fadeIn 0.3s ease',
        }}>
          {actionFeedback}
        </div>
      )}

      {/* Help panel */}
      {showHelp && (
        <div style={{
          position: 'fixed',
          bottom: '140px',
          right: '16px',
          zIndex: 9999,
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          maxWidth: '340px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          border: '1px solid #e5e7eb',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#1f2937' }}>
            🎤 Voice Commands (हिंदी)
          </h3>
          <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.8' }}>
            <div><strong>Product Add:</strong> "Tamatar, 30 rupaye kilo, 500 kilo"</div>
            <div><strong>Price Check:</strong> "Tamatar ka daam kya hai?"</div>
            <div><strong>My Products:</strong> "Mere product dikhao"</div>
            <div><strong>My Orders:</strong> "Mere orders dikhao"</div>
            <div><strong>Demand Map:</strong> "Demand dekho"</div>
            <div><strong>Harvest:</strong> "Harvest manage karo"</div>
            <div><strong>Earnings:</strong> "Kamaai dekho"</div>
            <div><strong>Mandi Prices:</strong> "Mandi prices dikhao"</div>
            <div><strong>Global Trade:</strong> "Global trade kholo"</div>
            <div><strong>Marketplace:</strong> "Marketplace kholo"</div>
            <div><strong>Order Clubbing:</strong> "Order club dikhao"</div>
            <div><strong>Dashboard:</strong> "Dashboard kholo"</div>
            <div><strong>Help:</strong> "Help" ya "Madad"</div>
          </div>
          <button onClick={() => setShowHelp(false)} style={{
            marginTop: '12px', width: '100%', padding: '8px',
            background: '#f3f4f6', border: 'none', borderRadius: '8px',
            fontSize: '13px', cursor: 'pointer', color: '#374151',
          }}>Band karein</button>
        </div>
      )}

      {/* Error */}
      {voice.error && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          right: '16px',
          zIndex: 9999,
          background: '#fef2f2',
          color: '#dc2626',
          borderRadius: '12px',
          padding: '12px 16px',
          maxWidth: '280px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '13px',
          border: '1px solid #fecaca',
        }}>
          ⚠️ {voice.error}
        </div>
      )}

      <style>{`
        @keyframes pulse-voice {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
          70% { box-shadow: 0 0 0 16px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
