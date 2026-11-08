import React, { useState, useRef, useEffect } from 'react';
import Canvas3D from './Canvas3D';
import TattooExtractor from './TattooExtractor';
import {
  Sparkles,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Image as ImageIcon,
  Sliders,
  CheckCircle2,
  X,
  Layers,
  HelpCircle,
  Sun,
  RotateCw,
  Info
} from 'lucide-react';

const BODY_PARTS = [
  {
    id: 'torso',
    name: 'نیم‌تنه بالا',
    path: '/models/body_parts/torso.glb',
    icon: '👕',
    zones: [
      { id: 0, label: 'سرشانه / سینه', rotOffset: 0 },
      { id: 1, label: 'پهلوی چپ مدل', rotOffset: 90 },
      { id: 2, label: 'پهلوی راست مدل', rotOffset: -90 },
    ]
  },
  {
    id: 'arm_right',
    name: 'دست راست',
    path: '/models/body_parts/arm_right.glb',
    icon: '💪',
    zones: [
      { id: 0, label: 'دید از چپ مدل (FL)', rotOffset: 79 },
      { id: 1, label: 'دید از راست مدل (FR)', rotOffset: 79 },
      { id: 2, label: 'دید از بالا (FT)', rotOffset: 169 },
      { id: 3, label: 'دید از پایین (FB)', rotOffset: -11 },
    ]
  },
  {
    id: 'arm_left',
    name: 'دست چپ',
    path: '/models/body_parts/arm_left.glb',
    icon: '💪',
    zones: [
      { id: 0, label: 'دید از چپ مدل (FL)', rotOffset: 79 },
      { id: 1, label: 'دید از راست مدل (FR)', rotOffset: 79 },
      { id: 2, label: 'دید از بالا (FT)', rotOffset: 169 },
      { id: 3, label: 'دید از پایین (FB)', rotOffset: -11 },
    ]
  },
  {
    id: 'leg_right',
    name: 'پای راست',
    path: '/models/body_parts/leg_right.glb',
    icon: '🦵',
    zones: [
      { id: 2, label: 'دید از راست مدل', rotOffset: 0 },
      { id: 3, label: 'ساق پا / رو‌به‌رو', rotOffset: 90 },
      { id: 0, label: 'دید از چپ مدل', rotOffset: 0 },
      { id: 1, label: 'پشت پا / دوقلو', rotOffset: 180 },
    ]
  },
  {
    id: 'leg_left',
    name: 'پای چپ',
    path: '/models/body_parts/leg_left.glb',
    icon: '🦵',
    zones: [
      { id: 0, label: 'دید از راست مدل', rotOffset: 0 },
      { id: 3, label: 'ساق پا / رو‌به‌رو', rotOffset: 90 },
      { id: 2, label: 'دید از چپ مدل', rotOffset: 0 },
      { id: 1, label: 'پشت پا / دوقلو', rotOffset: 180 },
    ]
  },
  {
    id: 'head',
    name: 'سر',
    path: '/models/body_parts/head.glb',
    icon: '👤',
    zones: [
      { id: 0, label: 'دید صورت (FF)', rotOffset: 0 },
      { id: 1, label: 'دید پشت سر (FB)', rotOffset: 180 },
    ]
  },
  {
    id: 'full_body',
    name: 'بدن کامل',
    path: '/models/body_parts/full_body.glb',
    icon: '🧍',
    zones: []
  },
];

function PhysicsSlider({ label, value, min, max, unit = '', onChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [tilt, setTilt] = useState(0);
  const lastXRef = useRef(null);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    lastXRef.current = e.clientX;
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    if (lastXRef.current !== null) {
      const deltaX = e.clientX - lastXRef.current;
      const calculatedTilt = Math.max(-25, Math.min(25, -deltaX * 3));
      setTilt(calculatedTilt);
    }
    lastXRef.current = e.clientX;
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setTilt(0);
    lastXRef.current = null;
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ marginBottom: '16px', userSelect: 'none' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: '#a1a1aa',
        marginBottom: '6px',
        direction: 'rtl'
      }}>
        <span>{label}</span>
        <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{value}{unit}</span>
      </div>

      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', direction: 'ltr' }}>
        {isDragging && (
          <div
            style={{
              position: 'absolute',
              bottom: '22px',
              left: `${percentage}%`,
              transform: `translateX(-50%) rotate(${tilt}deg)`,
              transformOrigin: 'bottom center',
              transition: 'transform 0.05s ease-out',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '700',
              padding: '2px 7px',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
              pointerEvents: 'none',
              zIndex: 30,
              whiteSpace: 'nowrap'
            }}
          >
            {value}{unit}
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid #3b82f6'
            }} />
          </div>
        )}

        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onPointerDown={handlePointerDown}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '999px',
            appearance: 'none',
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #27272a ${percentage}%, #27272a 100%)`,
            outline: 'none',
            cursor: 'ew-resize',
            margin: 0
          }}
        />
      </div>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(1);
  const [selectedPart, setSelectedPart] = useState(BODY_PARTS[0]);
  const [tattoos, setTattoos] = useState([]);
  const [selectedTattooId, setSelectedTattooId] = useState(null);
  const [isPlacingMode, setIsPlacingMode] = useState(false);

  const [isUVMode, setIsUVMode] = useState(false);
  const [activeUVZone, setActiveUVZone] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const [showFullBodyModal, setShowFullBodyModal] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [lightAngle, setLightAngle] = useState(45);

  const [openSection, setOpenSection] = useState('tattoos');
  const [contextMenu, setContextMenu] = useState(null);
  const longPressTimerRef = useRef(null);

  const [tattooTransforms, setTattooTransforms] = useState({});
  const [isPortraitBlocked, setIsPortraitBlocked] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || ('ontouchstart' in window && window.innerWidth <= 1024);
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsPortraitBlocked(isMobile && isPortrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  useEffect(() => {
    if (selectedPart && selectedPart.zones && selectedPart.zones.length > 0) {
      setActiveUVZone(selectedPart.zones[0].id);
    } else {
      setActiveUVZone(0);
      setIsUVMode(false);
    }
  }, [selectedPart]);

  const activeTattoo = tattoos.find((t) => t.id === selectedTattooId) || null;
  const currentTransform = (selectedTattooId && tattooTransforms[selectedTattooId]) || {
    scale: 35,
    rotZ: 0
  };

  const updateTransform = (key, val) => {
    if (!selectedTattooId) return;
    setTattooTransforms((prev) => ({
      ...prev,
      [selectedTattooId]: {
        ...(prev[selectedTattooId] || { scale: 35, rotZ: 0 }),
        [key]: val
      }
    }));
  };

  const handleToggleUVMode = () => {
    if (selectedPart.id === 'full_body') {
      setShowFullBodyModal(true);
      return;
    }
    setIsUVMode(!isUVMode);
  };

  const handlePlaceTattoo = (point, normal, uv, channel, modeUsed) => {
    if (!selectedTattooId) return;
    const currentZone = selectedPart.zones?.find((z) => z.id === channel);
    const zoneOffset = currentZone?.rotOffset ?? 0;

    setTattoos((prev) =>
      prev.map((t) =>
        t.id === selectedTattooId
          ? {
              ...t,
              position: [point.x, point.y, point.z],
              normal: [normal.x, normal.y, normal.z],
              hitUV: uv,
              uvChannel: channel,
              isUVMode: modeUsed,
              zoneOffset: zoneOffset
            }
          : t
      )
    );
  };

  const handleFileUpload = (files) => {
    const newItems = Array.from(files).filter(f => f.type.startsWith('image/')).map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      url: URL.createObjectURL(file),
      position: null,
      hitUV: null,
      zoneOffset: 0
    }));
    if (newItems.length > 0) {
      setTattoos((prev) => [...prev, ...newItems]);
      if (!selectedTattooId) {
        setSelectedTattooId(newItems[0].id);
      }
    }
  };

  const handleDeleteTattoo = (id, e) => {
    if (e) e.stopPropagation();
    setTattoos((prev) => prev.filter((t) => t.id !== id));
    if (selectedTattooId === id) {
      const remaining = tattoos.filter((t) => t.id !== id);
      setSelectedTattooId(remaining.length > 0 ? remaining[0].id : null);
    }
    setContextMenu(null);
  };

  const handleContextMenu = (e, id) => {
    e.preventDefault();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  };

  const handleTouchStart = (id, e) => {
    const touch = e.touches[0];
    longPressTimerRef.current = setTimeout(() => {
      setContextMenu({ id, x: touch.clientX, y: touch.clientY });
    }, 550);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  return (
    <div
      className="notranslate"
      translate="no"
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#09090b',
        color: '#f4f4f5',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        direction: 'rtl',
        position: 'relative'
      }}
      onClick={() => setContextMenu(null)}
    >
      {/* Mobile Orientation Overlay */}
      {isPortraitBlocked && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(9, 9, 11, 0.94)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          color: '#ffffff'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <RotateCw size={32} color="#60a5fa" style={{ animation: 'spin 3s linear infinite' }} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>دستگاه را افقی کنید</h2>
          <p style={{ fontSize: '13px', color: '#a1a1aa', maxWidth: '320px', lineHeight: '1.7' }}>
            برای مشاهده مناسب بوم سه‌بعدی و دسترسی کامل به ابزارهای تتو، لطفاً جهت گوشی یا تبلت خود را به حالت افقی (Landscape) تغییر دهید.
          </p>
          <style>{`
            @keyframes spin { 
              0% { transform: rotate(0deg); } 
              100% { transform: rotate(360deg); } 
            }
          `}</style>
        </div>
      )}

      {/* Full Body UV Notice Modal */}
      {showFullBodyModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowFullBodyModal(false)}
        >
          <div
            style={{
              backgroundColor: '#18181b',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              direction: 'rtl'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', color: '#60a5fa' }}>
              <Info size={22} />
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#fff' }}>
                راهنمای حالت مدل «بدن کامل»
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#d4d4d8', lineHeight: '1.8', margin: '0 0 20px 0' }}>
              مدل بدن کامل اختصاصاً جهت جانمایی یکپارچه طرح‌ها در <strong>نواحی مرزی و اتصالات اندام‌ها</strong> (مانند اتصال کتف به بازو، سرشانه، یا پهلو به ران) طراحی شده است تا تتو بدون قطع‌شدگی اعمال شود.
              <br /><br />
              چنانچه قصد دارید طرحی عریض را به دور بازو، ساق، یا پهلو اجرا کنید، لطفاً از منوی مرحله اول، <strong>مدل اختصاصی همان عضو (دست، پا و...)</strong> را انتخاب فرمایید.
            </p>
            <button
              onClick={() => setShowFullBodyModal(false)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: 'rgba(24, 24, 27, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '6px',
            zIndex: 100,
            boxShadow: '0 10px 25px rgba(0,0,0,0.6)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => handleDeleteTattoo(contextMenu.id, e)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ef4444',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              borderRadius: '6px'
            }}
          >
            <Trash2 size={15} />
            <span>حذف طرح</span>
          </button>
        </div>
      )}

      {/* Step 1: Body Part Selection */}
      {step === 1 && (
        <div style={{ flex: 1, padding: '32px 20px', overflowY: 'auto', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '999px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              <Sparkles size={16} />
              <span>مرحله ۱ از ۳: انتخاب موضع تتو</span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>
              کدام بخش از بدن را می‌خواهید؟
            </h1>
            <p style={{ color: '#71717a', fontSize: '13px' }}>
              عضو مورد نظر خود را برای شروع انتخاب نمایید.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
            {BODY_PARTS.map((part) => (
              <div
                key={part.id}
                onClick={() => {
                  setSelectedPart(part);
                  setStep(2);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    {part.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>
                      {part.name}
                    </h3>
                  </div>
                </div>
                <ChevronLeft size={18} color="#71717a" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Tattoo Extraction & Upload */}
      {step === 2 && (
        <div style={{ flex: 1, padding: '30px 20px', maxWidth: '750px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button
              onClick={() => setStep(1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#d4d4d8',
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              <ArrowRight size={16} />
              <span>تغییر موضع ({selectedPart.name})</span>
            </button>
            <div style={{ fontSize: '13px', color: '#60a5fa', fontWeight: '600' }}>مرحله ۲ از ۳: آپلود طرح‌های تتو</div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <TattooExtractor
              onUseDesign={(file) => handleFileUpload([file])}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '12px' }}>
              طرح‌های وارد شده ({tattoos.length}):
            </div>
            {tattoos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#52525b', fontSize: '13px' }}>
                هنوز هیچ طرحی اضافه نشده است.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px' }}>
                {tattoos.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      position: 'relative',
                      aspectRatio: '1/1',
                      borderRadius: '12px',
                      backgroundColor: '#ffffff',
                      border: selectedTattooId === t.id ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.2)',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    <img src={t.url} alt={t.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    <button
                      onClick={(e) => handleDeleteTattoo(t.id, e)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 5
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            disabled={tattoos.length === 0}
            onClick={() => setStep(3)}
            style={{
              padding: '13px',
              borderRadius: '12px',
              background: tattoos.length > 0 ? '#3b82f6' : 'rgba(255,255,255,0.08)',
              color: tattoos.length > 0 ? '#fff' : '#71717a',
              border: 'none',
              fontWeight: '700',
              fontSize: '14px',
              cursor: tattoos.length > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>ورود به استودیوی سه‌بعدی</span>
            <ChevronLeft size={18} />
          </button>
        </div>
      )}

      {/* Step 3: Interactive 3D Studio (LTR Layout: Viewport on Left, Sidebar on Right) */}
      {step === 3 && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          direction: 'ltr',
          position: 'relative'
        }}>

          {/* 1. Main 3D Viewport */}
          <div style={{
            flex: 1,
            height: '100%',
            position: 'relative',
            overflow: 'hidden'
          }}>

            {/* Top Toolbar */}
            <div style={{
              position: 'absolute',
              top: '14px',
              left: '14px',
              zIndex: 30,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '6px',
              background: 'rgba(18, 18, 20, 0.88)',
              backdropFilter: 'blur(12px)',
              padding: '6px 10px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '12px',
              direction: 'rtl'
            }}>
              <button
                onClick={() => setStep(2)}
                style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <ArrowRight size={14} />
                <span>طرح‌ها</span>
              </button>
              <span style={{ color: '#3f3f46' }}>|</span>

              <button
                onClick={handleToggleUVMode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: isUVMode ? 'rgba(147, 51, 234, 0.25)' : 'rgba(255,255,255,0.06)',
                  color: isUVMode ? '#c084fc' : '#a1a1aa',
                  border: '1px solid ' + (isUVMode ? '#9333ea' : 'rgba(255,255,255,0.1)'),
                  padding: '5px 9px',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
              >
                <Layers size={13} />
                <span>{isUVMode ? 'طرح عریض (فعال)' : 'طرح استاندارد'}</span>
              </button>

              {isUVMode && selectedPart.zones && selectedPart.zones.length > 0 && (
                <div style={{ display: 'flex', gap: '3px', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '6px' }}>
                  {selectedPart.zones.map((zone) => (
                    <button
                      key={zone.id}
                      onClick={() => setActiveUVZone(zone.id)}
                      style={{
                        background: activeUVZone === zone.id ? '#9333ea' : 'transparent',
                        color: activeUVZone === zone.id ? '#fff' : '#a1a1aa',
                        border: 'none',
                        borderRadius: '5px',
                        padding: '4px 7px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: activeUVZone === zone.id ? '700' : '400',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {zone.label}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowGuide(!showGuide)}
                style={{ background: 'none', border: 'none', color: showGuide ? '#38bdf8' : '#71717a', cursor: 'pointer' }}
                title="راهنما"
              >
                <HelpCircle size={15} />
              </button>

              <span style={{ color: '#3f3f46' }}>|</span>

              <button
                onClick={() => setIsPlacingMode(!isPlacingMode)}
                style={{
                  background: isPlacingMode ? '#2563eb' : 'rgba(255,255,255,0.08)',
                  color: isPlacingMode ? '#fff' : '#a1a1aa',
                  border: '1px solid ' + (isPlacingMode ? '#3b82f6' : 'rgba(255,255,255,0.1)'),
                  padding: '5px 9px',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                {isPlacingMode ? '🎯 لمس پوست (فعال)' : '🔄 چرخش ۳بعدی'}
              </button>
            </div>

            {showGuide && (
              <div style={{
                position: 'absolute',
                top: '56px',
                left: '14px',
                zIndex: 30,
                width: '280px',
                backgroundColor: 'rgba(24, 24, 27, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(147, 51, 234, 0.3)',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '12px',
                lineHeight: '1.6',
                color: '#d4d4d8',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                direction: 'rtl'
              }}>
                <div style={{ fontWeight: '700', color: '#c084fc', marginBottom: '4px' }}>راهنمای انتخاب موضع:</div>
                اگر طرح بسیار عریض است و روی انحنای عضو کش می‌آید، حالت «طرح عریض» را روشن کرده و زاویه مورد نظر عضو را انتخاب کنید تا طرح با چرخش طبیعی و بدون دفرمه شدن قرار گیرد.
              </div>
            )}

            <Canvas3D
              modelPath={selectedPart.path}
              tattoos={tattoos}
              tattooTransforms={tattooTransforms}
              selectedTattooId={selectedTattooId}
              isPlacingMode={isPlacingMode}
              isUVMode={isUVMode}
              activeUVZone={activeUVZone}
              lightAngle={lightAngle}
              onPlaceTattoo={handlePlaceTattoo}
              onUpdateTransform={updateTransform}
            />
          </div>

          {/* 2. Floating Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            title={isSidebarOpen ? 'بستن پنل تنظیمات' : 'باز کردن پنل تنظیمات'}
            style={{
              position: 'absolute',
              top: '16px',
              right: isSidebarOpen ? '328px' : '14px',
              zIndex: 100,
              background: 'rgba(24, 24, 27, 0.96)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
              borderRadius: '8px',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
              transition: 'right 0.28s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {isSidebarOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} color="#60a5fa" />}
          </button>

          {/* 3. Collapsible Controls Sidebar */}
          <div style={{
            width: isSidebarOpen ? '320px' : '0px',
            minWidth: isSidebarOpen ? '320px' : '0px',
            maxWidth: '350px',
            height: '100%',
            backgroundColor: '#121215',
            borderLeft: isSidebarOpen ? '1px solid #1f1f23' : 'none',
            transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            direction: 'rtl',
            zIndex: 40
          }}>
            <div style={{
              width: '320px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden'
            }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>

                {/* 1. Tattoo List Accordion */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  marginBottom: '10px',
                  overflow: 'hidden'
                }}>
                  <div
                    onClick={() => setOpenSection(openSection === 'tattoos' ? '' : 'tattoos')}
                    style={{
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: 'rgba(255,255,255,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700' }}>
                      <ImageIcon size={16} color="#60a5fa" />
                      <span>طرح‌های تتو</span>
                      <span style={{ fontSize: '11px', background: '#27272a', padding: '1px 6px', borderRadius: '10px', color: '#a1a1aa' }}>
                        {tattoos.length}
                      </span>
                    </div>
                    {openSection === 'tattoos' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>

                  {openSection === 'tattoos' && (
                    <div style={{ padding: '12px' }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))',
                        gap: '8px'
                      }}>
                        {tattoos.map((tattoo) => {
                          const isSelected = tattoo.id === selectedTattooId;
                          return (
                            <div
                              key={tattoo.id}
                              onClick={() => setSelectedTattooId(tattoo.id)}
                              onContextMenu={(e) => handleContextMenu(e, tattoo.id)}
                              onTouchStart={(e) => handleTouchStart(tattoo.id, e)}
                              onTouchEnd={handleTouchEnd}
                              style={{
                                aspectRatio: '1/1',
                                borderRadius: '10px',
                                backgroundColor: '#ffffff',
                                border: isSelected ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: isSelected ? '0 0 12px rgba(59, 130, 246, 0.4)' : 'none',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'all 0.15s ease',
                                overflow: 'hidden'
                              }}
                            >
                              <img
                                src={tattoo.url}
                                alt={tattoo.name}
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                              />
                              {isSelected && (
                                <div style={{ position: 'absolute', top: '3px', right: '3px' }}>
                                  <CheckCircle2 size={12} color="#3b82f6" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Transform Settings Accordion */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  marginBottom: '10px',
                  overflow: 'hidden'
                }}>
                  <div
                    onClick={() => setOpenSection(openSection === 'settings' ? '' : 'settings')}
                    style={{
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: 'rgba(255,255,255,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700' }}>
                      <Sliders size={16} color="#60a5fa" />
                      <span>تنظیمات طرح انتخاب شده</span>
                    </div>
                    {openSection === 'settings' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>

                  {openSection === 'settings' && (
                    <div style={{ padding: '14px' }}>
                      {activeTattoo ? (
                        <>
                          <PhysicsSlider
                            label="بزرگ‌نمایی (Scale)"
                            min={10}
                            max={250}
                            value={currentTransform.scale}
                            unit="%"
                            onChange={(v) => updateTransform('scale', v)}
                          />

                          <div style={{
                            marginTop: '16px',
                            paddingTop: '12px',
                            borderTop: '1px solid rgba(255,255,255,0.06)'
                          }}>
                            <PhysicsSlider
                              label="چرخش (Rotation)"
                              min={0}
                              max={360}
                              value={currentTransform.rotZ}
                              unit="°"
                              onChange={(v) => updateTransform('rotZ', v)}
                            />
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', color: '#71717a', fontSize: '12px', padding: '14px 0' }}>
                          طرحی انتخاب نشده است.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Studio Lighting Accordion */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                  <div
                    onClick={() => setOpenSection(openSection === 'lighting' ? '' : 'lighting')}
                    style={{
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: 'rgba(255,255,255,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700' }}>
                      <Sun size={16} color="#f59e0b" />
                      <span>نورپردازی استودیو</span>
                    </div>
                    {openSection === 'lighting' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>

                  {openSection === 'lighting' && (
                    <div style={{ padding: '14px' }}>
                      <PhysicsSlider
                        label="زاویه تابش نور (Light Orbit)"
                        min={0}
                        max={360}
                        value={lightAngle}
                        unit="°"
                        onChange={(v) => setLightAngle(v)}
                      />
                    </div>
                  )}
                </div>

              </div>

              {/* Bottom Status Bar */}
              <div style={{
                padding: '14px',
                backgroundColor: '#0c0c0e',
                borderTop: '1px solid #1f1f23',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                width: '320px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#71717a' }}>سیستم فعال:</div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#f4f4f5' }}>
                    {isUVMode ? 'موضع تطبیقی (انحنای عریض)' : 'پروجکشن استاندارد'}
                  </div>
                </div>

                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3px',
                  overflow: 'hidden'
                }}>
                  {activeTattoo ? (
                    <img src={activeTattoo.url} alt="طرح فعال" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: '10px', color: '#71717a' }}>خالی</span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}