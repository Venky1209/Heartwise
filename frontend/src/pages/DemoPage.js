import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── Auth Modal ───────────────────────────────────────────────────────────────
const AuthModal = ({ onClose }) => {
  const navigate = useNavigate();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative rounded-2xl p-8 w-full max-w-sm text-center"
        style={{ backgroundColor: '#1E1A1D', border: '1px solid #3A3438', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 text-xl font-bold">×</button>

        {/* Icon */}
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(240,171,252,0.2), rgba(168,85,247,0.2))', border: '1px solid rgba(240,171,252,0.3)' }}>
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#F0ABFC" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold mb-1" style={{ color: '#F5F0F2' }}>Sign in to HeartWise</h2>
        <p className="text-sm mb-6" style={{ color: '#7A7078' }}>Create an account or log in to access your full dashboard, ECG analysis, and health reports.</p>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #F0ABFC, #A855F7)', color: '#1E1A1D' }}
          >
            Log In
          </button>
          <button
            onClick={() => navigate('/register')}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200"
            style={{ backgroundColor: 'rgba(240,171,252,0.1)', color: '#F0ABFC', border: '1px solid rgba(240,171,252,0.3)' }}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Animated ECG Canvas ──────────────────────────────────────────────────────
const ECGCanvas = ({ height = 80, color = '#F0ABFC', speed = 1 }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const mid = H / 2;

    const ecgShape = (x) => {
      const cycle = x % 160;
      if (cycle < 20) return 0;
      if (cycle < 30) return -3;
      if (cycle < 38) return (cycle - 30) * 3.5;
      if (cycle < 42) return 28 - (cycle - 38) * 7;
      if (cycle < 50) return (cycle - 42) * -0.5;
      if (cycle < 70) return Math.sin((cycle - 50) / 20 * Math.PI) * 8;
      return 0;
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;

      for (let x = 0; x < W; x++) {
        const val = ecgShape(x + offsetRef.current);
        const y = mid - val;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      offsetRef.current += speed;
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [color, speed]);

  return <canvas ref={canvasRef} width={600} height={height} style={{ width: '100%', height }} />;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon, onClick }) => (
  <div
    onClick={onClick}
    className="rounded-xl p-5 cursor-pointer transition-all duration-200"
    style={{ backgroundColor: '#17151A', border: '1px solid #2A2528' }}
    onMouseEnter={e => e.currentTarget.style.borderColor = '#F0ABFC55'}
    onMouseLeave={e => e.currentTarget.style.borderColor = '#2A2528'}
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-2xl">{icon}</span>
      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(240,171,252,0.1)', color: '#F0ABFC' }}>LIVE</span>
    </div>
    <p className="text-3xl font-bold mb-1" style={{ color: '#F5F0F2' }}>{value}</p>
    <p className="text-sm" style={{ color: '#A89DA3' }}>{label}</p>
    {sub && <p className="text-xs mt-1" style={{ color: '#7A7078' }}>{sub}</p>}
  </div>
);

// ─── Feature Preview Card ─────────────────────────────────────────────────────
const FeatureCard = ({ title, desc, icon, badge, onClick }) => (
  <div
    onClick={onClick}
    className="rounded-xl p-5 cursor-pointer transition-all duration-200 group"
    style={{ backgroundColor: '#17151A', border: '1px solid #2A2528' }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#F0ABFC55'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2528'; e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    <div className="flex items-start justify-between mb-3">
      <span className="text-2xl">{icon}</span>
      {badge && (
        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(240,171,252,0.15)', color: '#F0ABFC' }}>
          {badge}
        </span>
      )}
    </div>
    <h3 className="font-semibold mb-1 text-sm" style={{ color: '#F5F0F2' }}>{title}</h3>
    <p className="text-xs leading-relaxed" style={{ color: '#7A7078' }}>{desc}</p>
    <div className="mt-3 flex items-center text-xs font-medium" style={{ color: '#F0ABFC' }}>
      Try it →
    </div>
  </div>
);

// ─── Fake Session Row ─────────────────────────────────────────────────────────
const FakeSessionRow = ({ name, type, bpm, status, onClick }) => (
  <div
    onClick={onClick}
    className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200"
    style={{ backgroundColor: '#1E1A1D', border: '1px solid #2A2528' }}
    onMouseEnter={e => e.currentTarget.style.borderColor = '#F0ABFC44'}
    onMouseLeave={e => e.currentTarget.style.borderColor = '#2A2528'}
  >
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
        style={{ backgroundColor: 'rgba(240,171,252,0.15)', color: '#F0ABFC' }}>
        {name[0]}
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: '#F5F0F2' }}>{name}</p>
        <p className="text-xs" style={{ color: '#7A7078' }}>{type}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold" style={{ color: '#F0ABFC' }}>{bpm} BPM</span>
      <span className={`text-xs px-2 py-0.5 rounded-full ${status === 'Active' ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(100,100,120,0.2)', color: status === 'Active' ? '#10b981' : '#7A7078' }}>
        {status}
      </span>
    </div>
  </div>
);

// ─── Main DemoPage ────────────────────────────────────────────────────────────
const DemoPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [bpm, setBpm] = useState(72);
  const { user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) navigate('/app/dashboard');
  }, [user, navigate]);

  // Animate BPM value
  useEffect(() => {
    const interval = setInterval(() => {
      setBpm(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(60, Math.min(90, prev + delta));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const prompt = () => setShowModal(true);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1E1A1D', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      {showModal && <AuthModal onClose={() => setShowModal(false)} />}

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: 'rgba(23,21,26,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #2A2528' }}>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#F0ABFC" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <span className="font-semibold tracking-wide" style={{ color: '#F0ABFC' }}>heartwise</span>
          <span className="text-xs px-2 py-0.5 rounded-full ml-1" style={{ backgroundColor: 'rgba(240,171,252,0.1)', color: '#F0ABFC' }}>DEMO</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="text-sm px-4 py-2 rounded-lg transition-colors"
            style={{ color: '#A89DA3' }}
            onMouseEnter={e => e.currentTarget.style.color = '#F5F0F2'}
            onMouseLeave={e => e.currentTarget.style.color = '#A89DA3'}>
            Log in
          </button>
          <button onClick={() => navigate('/register')} className="text-sm px-4 py-2 rounded-lg font-medium transition-all"
            style={{ background: 'linear-gradient(135deg, #F0ABFC, #A855F7)', color: '#1E1A1D' }}>
            Get Started
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* ── Hero Banner ── */}
        <div className="rounded-2xl p-8 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #17151A 0%, #1E1A1D 50%, #17151A 100%)', border: '1px solid #2A2528' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ background: 'radial-gradient(ellipse at 70% 50%, #F0ABFC 0%, transparent 60%)' }} />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#10b981' }} />
                <span className="text-xs font-medium" style={{ color: '#10b981' }}>LIVE PREVIEW — No login required</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#F5F0F2' }}>
                Your Heart Intelligence<br />
                <span style={{ background: 'linear-gradient(135deg, #F0ABFC, #A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Platform
                </span>
              </h1>
              <p className="text-sm" style={{ color: '#7A7078', maxWidth: '400px' }}>
                Explore HeartWise with live simulated data. Sign in to connect your real ECG device and unlock full analytics.
              </p>
            </div>
            <div className="text-center p-6 rounded-2xl flex-shrink-0"
              style={{ backgroundColor: '#17151A', border: '1px solid #2A2528', minWidth: '160px' }}>
              <p className="text-5xl font-bold" style={{ color: '#F0ABFC' }}>{bpm}</p>
              <p className="text-sm mt-1" style={{ color: '#A89DA3' }}>BPM (simulated)</p>
              <div className="mt-2 flex justify-center">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#F0ABFC' }} />
              </div>
            </div>
          </div>

          {/* Live ECG strip */}
          <div className="mt-6 rounded-xl overflow-hidden" style={{ backgroundColor: '#0D0B0F', border: '1px solid #2A2528' }}>
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#10b981' }} />
                <span className="text-xs font-medium" style={{ color: '#10b981' }}>LIVE SENSOR FEED</span>
              </div>
              <span className="text-xs" style={{ color: '#3A3438' }}>Sinus Rhythm · No Anomalies</span>
            </div>
            <ECGCanvas height={70} color="#F0ABFC" speed={1.5} />
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Active Sessions" value="3" sub="2 in progress" icon="❤️" onClick={prompt} />
          <StatCard label="Analyses Done" value="142" sub="Last 30 days" icon="📊" onClick={prompt} />
          <StatCard label="Risk Score" value="Low" sub="Excellent" icon="🛡️" onClick={prompt} />
          <StatCard label="Devices" value="2" sub="Both online" icon="📡" onClick={prompt} />
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Sessions */}
          <div className="lg:col-span-2 rounded-xl p-5" style={{ backgroundColor: '#17151A', border: '1px solid #2A2528' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm" style={{ color: '#F5F0F2' }}>Recent ECG Sessions</h3>
              <button onClick={prompt} className="text-xs" style={{ color: '#F0ABFC' }}>View all →</button>
            </div>
            <div className="space-y-2">
              <FakeSessionRow name="Venkat K." type="Resting ECG · 12-Lead" bpm={74} status="Active" onClick={prompt} />
              <FakeSessionRow name="Venkat K." type="Post-exercise ECG" bpm={112} status="Completed" onClick={prompt} />
              <FakeSessionRow name="Venkat K." type="Sleep monitoring" bpm={58} status="Completed" onClick={prompt} />
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid #2A2528' }}>
              <button onClick={prompt} className="w-full py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{ backgroundColor: 'rgba(240,171,252,0.1)', color: '#F0ABFC', border: '1px solid rgba(240,171,252,0.2)' }}>
                + Start New ECG Session
              </button>
            </div>
          </div>

          {/* Mini ECG Monitor panel */}
          <div className="rounded-xl p-5 flex flex-col" style={{ backgroundColor: '#17151A', border: '1px solid #2A2528' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm" style={{ color: '#F5F0F2' }}>Live Monitor</h3>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#10b981' }} />
            </div>
            <div className="flex-1 rounded-lg overflow-hidden mb-3" style={{ backgroundColor: '#0D0B0F', border: '1px solid #2A2528' }}>
              <ECGCanvas height={100} color="#10b981" speed={1.2} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              {[['QRS', '0.08s'], ['PR', '0.16s'], ['QT', '0.38s'], ['ST', 'Normal']].map(([k, v]) => (
                <div key={k} className="rounded-lg py-2" style={{ backgroundColor: '#1E1A1D' }}>
                  <p className="text-xs" style={{ color: '#7A7078' }}>{k}</p>
                  <p className="text-sm font-semibold" style={{ color: '#F5F0F2' }}>{v}</p>
                </div>
              ))}
            </div>
            <button onClick={prompt} className="mt-3 w-full py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{ background: 'linear-gradient(135deg, #F0ABFC, #A855F7)', color: '#1E1A1D' }}>
              Analyse ECG →
            </button>
          </div>
        </div>

        {/* ── Features Grid ── */}
        <div>
          <h2 className="font-semibold mb-4 text-sm" style={{ color: '#A89DA3' }}>EXPLORE FEATURES</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <FeatureCard icon="🧠" title="AI ECG Analysis" desc="Deep learning model classifies arrhythmias and ST changes in real time." badge="AI" onClick={prompt} />
            <FeatureCard icon="🍎" title="Diet Recommendations" desc="Personalised cardiac diet plans based on your risk profile and history." badge="New" onClick={prompt} />
            <FeatureCard icon="🛡️" title="Risk Scoring" desc="Composite cardiovascular risk score updated after every session." onClick={prompt} />
            <FeatureCard icon="📋" title="Doctor Reports" desc="Export clinical-grade PDF reports to share with your cardiologist." onClick={prompt} />
            <FeatureCard icon="📅" title="Weekly Summary" desc="Visual recap of your heart trends, alerts and improvements." onClick={prompt} />
            <FeatureCard icon="🤖" title="AI Chat Assistant" desc="Ask questions about your ECG readings and get plain-language answers." badge="AI" onClick={prompt} />
            <FeatureCard icon="📡" title="ESP32 Device" desc="Connect your ESP32 ECG sensor for real-time 250Hz data streaming." onClick={prompt} />
            <FeatureCard icon="⚡" title="Real-time Alerts" desc="Instant notifications when abnormal rhythms are detected during monitoring." onClick={prompt} />
          </div>
        </div>

        {/* ── CTA Banner ── */}
        <div className="rounded-2xl p-8 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(240,171,252,0.1) 0%, rgba(168,85,247,0.1) 100%)', border: '1px solid rgba(240,171,252,0.2)' }}>
          <div className="absolute inset-0 opacity-5"
            style={{ background: 'radial-gradient(ellipse at center, #F0ABFC 0%, transparent 70%)' }} />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#F5F0F2' }}>Ready to monitor your real heart?</h2>
            <p className="text-sm mb-6" style={{ color: '#7A7078' }}>Connect your ESP32 ECG sensor and get clinical-grade insights in minutes.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => navigate('/register')} className="px-6 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{ background: 'linear-gradient(135deg, #F0ABFC, #A855F7)', color: '#1E1A1D' }}>
                Create Free Account
              </button>
              <button onClick={() => navigate('/login')} className="px-6 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{ backgroundColor: 'rgba(240,171,252,0.1)', color: '#F0ABFC', border: '1px solid rgba(240,171,252,0.3)' }}>
                Log In
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs pb-6" style={{ color: '#3A3438' }}>
          © 2026 HeartWise · All data shown is simulated for demonstration purposes
        </p>
      </div>
    </div>
  );
};

export default DemoPage;
