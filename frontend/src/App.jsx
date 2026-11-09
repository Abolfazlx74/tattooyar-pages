import React, { useState, useRef, useEffect, useMemo } from 'react';
import Canvas3D from './Canvas3D';
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
  Info,
  Search,
  Plus,
  Check
} from 'lucide-react';
import { PRESET_TATTOOS, TATTOO_CATEGORIES, getAssetUrl } from './presetTattoos';

const BODY_PARTS = [
  {
    id: 'torso',
    name: 'نیم‌تنه بالا',
    path: getAssetUrl('models/body_parts/torso.glb'),
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
    path: getAssetUrl('models/body_parts/arm_right.glb'),
    icon: '💪',
    zones: [
      { id: 0, label: 'دید چپ (FL)', rotOffset: 79 },
      { id: 1, label: 'دید راست (FR)', rotOffset: 79 },
      { id: 2, label: 'دید بالا (FT)', rotOffset: 169 },
      { id: 3, label: 'دید پایین (FB)', rotOffset: -11 },
    ]
  },
  {
    id: 'arm_left',
    name: 'دست چپ',
    path: getAssetUrl('models/body_parts/arm_left.glb'),
    icon: '💪',
    zones: [
      { id: 0, label: 'دید چپ (FL)', rotOffset: 79 },
      { id: 1, label: 'دید راست (FR)', rotOffset: 79 },
      { id: 2, label: 'دید بالا (FT)', rotOffset: 169 },
      { id: 3, label: 'دید پایین (FB)', rotOffset: -11 },
    ]
  },
  {
    id: 'leg_right',
    name: 'پای راست',
    path: getAssetUrl('models/body_parts/leg_right.glb'),
    icon: '🦵',
    zones: [
      { id: 2, label: 'دید راست', rotOffset: 0 },
      { id: 3, label: 'ساق پا', rotOffset: 90 },
      { id: 0, label: 'دید چپ', rotOffset: 0 },
      { id: 1, label: 'پشت پا', rotOffset: 180 },
    ]
  },
  {
    id: 'leg_left',
    name: 'پای چپ',
    path: getAssetUrl('models/body_parts/leg_left.glb'),
    icon: '🦵',
    zones: [
      { id: 0, label: 'دید راست', rotOffset: 0 },
      { id: 3, label: 'ساق پا', rotOffset: 90 },
      { id: 2, label: 'دید چپ', rotOffset: 0 },
      { id: 1, label: 'پشت پا', rotOffset: 180 },
    ]
  },
  {
    id: 'head',
    name: 'سر',
    path: getAssetUrl('models/body_parts/head.glb'),
    icon: '👤',
    zones: [
      { id: 0, label: 'صورت (FF)', rotOffset: 0 },
      { id: 1, label: 'پشت سر (FB)', rotOffset: 180 },
    ]
  },
  {
    id: 'full_body',
    name: 'بدن کامل',
    path: getAssetUrl('models/body_parts/full_body.glb'),
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
    <div style={{ marginBottom: '14px', userSelect: 'none', touchAction: 'none' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: '#a1a1aa',
        marginBottom: '4px',
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
              bottom: '20px',
              left: `${percentage}%`,
              transform: `translateX(-50%) rotate(${tilt}deg)`,
              transformOrigin: 'bottom center',
              transition: 'transform 0.05s ease-out',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: '700',
              padding: '2px 6px',
              borderRadius: '5px',
              boxShadow: '0 4px 10px rgba(59, 130, 246, 0.4)',
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
            margin: 0,
            touchAction: 'none'
          }}
        />
      </div>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(1);
  const [selectedPart, setSelectedPart] = useState(BODY_PARTS[0]);

  // Initial preset selection (Wolf, Dragon, Rose)
  const [tattoos, setTattoos] = useState(() => [
    {
      id: 'preset_wolf',
      name: 'گرگ هندسی',
      url: getAssetUrl('tattoos/wolf.png'),
      position: null,
      hitUV: null,
      zoneOffset: 0
    },
    {
      id: 'preset_dragon',
      name: 'اژدهای شرقی',
      url: getAssetUrl('tattoos/dragon.png'),
      position: null,
      hitUV: null,
      zoneOffset: 0
    },
    {
      id: 'preset_rose',
      name: 'رز سیاه',
      url: getAssetUrl('tattoos/rose.png'),
      position: null,
      hitUV: null,
      zoneOffset: 0
    }
  ]);
  const [selectedTattooId, setSelectedTattooId] = useState('preset_wolf');
  const [isPlacingMode, setIsPlacingMode] = useState(false);

  // Gallery filter state
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  const [isUVMode, setIsUVMode] = useState(false);
  const [activeUVZone, setActiveUVZone] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const [showFullBodyModal, setShowFullBodyModal] = useState(false);

  // Responsive state detection
  const [isMobileScreen, setIsMobileScreen] = useState(() => window.innerWidth < 900 || window.innerHeight < 560);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lightAngle, setLightAngle] = useState(45);

  const [openSection, setOpenSection] = useState('tattoos');
  const [contextMenu, setContextMenu] = useState(null);
  const longPressTimerRef = useRef(null);

  const [tattooTransforms, setTattooTransforms] = useState({});
  const [isPortraitBlocked, setIsPortraitBlocked] = useState(false);

  useEffect(() => {
    const handleScreenSize = () => {
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || ('ontouchstart' in window && window.innerWidth <= 1024);
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsPortraitBlocked(isMobile && isPortrait);
      const mobileSize = window.innerWidth < 900 || window.innerHeight < 560;
      setIsMobileScreen(mobileSize);
      // On desktop, keep sidebar open; on mobile, default to closed
      if (!mobileSize) {
        setIsSidebarOpen(true);
      }
    };

    handleScreenSize();
    window.addEventListener('resize', handleScreenSize);
    window.addEventListener('orientationchange', handleScreenSize);
    return () => {
      window.removeEventListener('resize', handleScreenSize);
      window.removeEventListener('orientationchange', handleScreenSize);
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

  const handleTogglePresetTattoo = (preset) => {
    setTattoos((prev) => {
      const exists = prev.some((t) => t.id === preset.id);
      if (exists) {
        const next = prev.filter((t) => t.id !== preset.id);
        if (selectedTattooId === preset.id) {
          setSelectedTattooId(next.length > 0 ? next[0].id : null);
        }
        return next;
      } else {
        const newTattoo = {
          id: preset.id,
          name: preset.name,
          url: getAssetUrl(`tattoos/${preset.filename}`),
          position: null,
          hitUV: null,
          zoneOffset: 0
        };
        if (!selectedTattooId) {
          setSelectedTattooId(preset.id);
        }
        return [...prev, newTattoo];
      }
    });
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

  // Filtered preset tattoos for Step 2 and modal
  const filteredPresets = useMemo(() => {
    return PRESET_TATTOOS.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch = !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div
      className="notranslate"
      translate="no"
      style={{
        width: '100vw',
        height: '100dvh',
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
          backgroundColor: 'rgba(9, 9, 11, 0.96)',
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
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <RotateCw size={28} color="#60a5fa" style={{ animation: 'spin 3s linear infinite' }} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>گوشی را افقی کنید</h2>
          <p style={{ fontSize: '12px', color: '#a1a1aa', maxWidth: '300px', lineHeight: '1.6' }}>
            برای مشاهده سه‌بعدی و دسترسی کامل به استودیو، گوشی را به حالت افقی (Landscape) بچرخانید.
          </p>
        </div>
      )}

      {/* Header bar */}
      <header
        className="app-header"
        style={{
          height: '48px',
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          backgroundColor: '#09090b',
          zIndex: 50
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)'
          }}>
            <Sparkles size={14} color="#fff" />
          </div>
          <div className="app-header-title" style={{ fontWeight: '800', fontSize: '14px' }}>
            تتویار <span style={{ fontSize: '10px', color: '#60a5fa', fontWeight: '600' }}>استودیوی سه‌بعدی</span>
          </div>
        </div>

        {/* Steps indicator */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
          <button
            onClick={() => setStep(1)}
            className="app-step-btn"
            style={{
              background: step === 1 ? 'rgba(59,130,246,0.2)' : 'transparent',
              color: step === 1 ? '#60a5fa' : '#71717a',
              border: step === 1 ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
              padding: '4px 8px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            ۱. عضو
          </button>
          <span style={{ color: '#3f3f46' }}>›</span>
          <button
            onClick={() => setStep(2)}
            className="app-step-btn"
            style={{
              background: step === 2 ? 'rgba(59,130,246,0.2)' : 'transparent',
              color: step === 2 ? '#60a5fa' : '#71717a',
              border: step === 2 ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
              padding: '4px 8px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            ۲. طرح‌ها ({tattoos.length})
          </button>
          <span style={{ color: '#3f3f46' }}>›</span>
          <button
            disabled={tattoos.length === 0}
            onClick={() => setStep(3)}
            className="app-step-btn"
            style={{
              background: step === 3 ? 'rgba(59,130,246,0.2)' : 'transparent',
              color: step === 3 ? '#60a5fa' : tattoos.length > 0 ? '#a1a1aa' : '#3f3f46',
              border: step === 3 ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
              padding: '4px 8px',
              borderRadius: '6px',
              cursor: tattoos.length > 0 ? 'pointer' : 'not-allowed',
              fontWeight: '600'
            }}
          >
            ۳. استودیو
          </button>
        </nav>
      </header>

      {/* Step 1: Body Part Selection */}
      {step === 1 && (
        <div className="scrollable-page" style={{ padding: '16px 14px' }}>
          <div style={{ maxWidth: '850px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>موضع تتو را انتخاب کنید</h1>
              <p style={{ color: '#a1a1aa', fontSize: '11px' }}>مدل سه‌بعدی مورد نظر را برای تست و جانمایی دقیق تتو انتخاب نمایید.</p>
            </div>

            <div className="body-part-grid">
              {BODY_PARTS.map((part) => {
                const isSelected = selectedPart.id === part.id;
                return (
                  <div
                    key={part.id}
                    onClick={() => {
                      setSelectedPart(part);
                      setStep(2);
                    }}
                    style={{
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      touchAction: 'manipulation'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontSize: '22px' }}>{part.icon}</div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '13px' }}>{part.name}</div>
                        <div style={{ fontSize: '10px', color: '#71717a', marginTop: '2px' }}>
                          {part.zones.length > 0 ? `${part.zones.length} زاویه تخصصی` : 'مدل جامع'}
                        </div>
                      </div>
                    </div>
                    <ChevronLeft size={16} color="#71717a" />
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px', paddingBottom: '16px' }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  padding: '9px 22px',
                  borderRadius: '10px',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(59,130,246,0.35)',
                  touchAction: 'manipulation'
                }}
              >
                <span>مرحله بعد: انتخاب طرح‌ها</span>
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Preset Tattoo Gallery Selection - Single Smooth Scroll Container */}
      {step === 2 && (
        <div className="scrollable-page" style={{ padding: '12px 14px' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* Top Navigation Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#d4d4d8',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  touchAction: 'manipulation'
                }}
              >
                <ArrowRight size={14} />
                <span>تغییر موضع ({selectedPart.name})</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '12px', color: '#60a5fa', fontWeight: '700' }}>
                  طرح‌های انتخابی: {tattoos.length}
                </div>
                <button
                  disabled={tattoos.length === 0}
                  onClick={() => setStep(3)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    background: tattoos.length > 0 ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                    color: tattoos.length > 0 ? '#fff' : '#71717a',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: tattoos.length > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: tattoos.length > 0 ? '0 3px 10px rgba(59,130,246,0.35)' : 'none',
                    touchAction: 'manipulation'
                  }}
                >
                  <span>ورود به استودیو</span>
                  <ChevronLeft size={15} />
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {/* Search input */}
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={14} color="#71717a" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در بین طرح‌های تتو (گرگ، اژدها، جمجمه، رز، وایکینگ...)"
                  style={{
                    width: '100%',
                    padding: '7px 32px 7px 10px',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none',
                    direction: 'rtl'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      left: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#71717a',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Horizontal Category Bar */}
              <div className="horizontal-scroll-bar">
                {TATTOO_CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      style={{
                        background: isActive ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                        color: isActive ? '#fff' : '#a1a1aa',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        fontWeight: isActive ? '700' : '500',
                        transition: 'all 0.15s',
                        touchAction: 'manipulation'
                      }}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct Tattoo Grid (No nested scroll!) */}
            <div className="tattoo-gallery-grid" style={{ minHeight: '200px' }}>
              {filteredPresets.map((preset) => {
                const isSelected = tattoos.some((t) => t.id === preset.id);
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleTogglePresetTattoo(preset)}
                    style={{
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                      touchAction: 'manipulation',
                      userSelect: 'none'
                    }}
                  >
                    {/* Checkbox indicator */}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      zIndex: 10,
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: isSelected ? '#3b82f6' : 'rgba(0,0,0,0.55)',
                      border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      boxShadow: isSelected ? '0 2px 6px rgba(59,130,246,0.5)' : 'none'
                    }}>
                      {isSelected ? <Check size={12} strokeWidth={3} /> : <Plus size={12} color="#a1a1aa" />}
                    </div>

                    {/* Tattoo Image Container */}
                    <div style={{
                      aspectRatio: '1/1',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px',
                      overflow: 'hidden',
                      boxShadow: 'inset 0 0 6px rgba(0,0,0,0.06)'
                    }}>
                      <img
                        src={getAssetUrl(`tattoos/${preset.filename}`)}
                        alt={preset.name}
                        loading="lazy"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                          pointerEvents: 'none',
                          filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))'
                        }}
                      />
                    </div>

                    {/* Info */}
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {preset.name}
                      </div>
                      <div style={{ fontSize: '9px', color: '#71717a', marginTop: '2px' }}>
                        {preset.categoryName}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sticky Bottom Bar */}
            <div style={{
              position: 'sticky',
              bottom: 0,
              zIndex: 35,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              background: 'rgba(18, 18, 22, 0.94)',
              backdropFilter: 'blur(12px)',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)',
              marginTop: '8px',
              marginBottom: '10px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.6)'
            }}>
              <div style={{ fontSize: '12px', color: '#d4d4d8' }}>
                برگزیده‌ها: <strong style={{ color: '#60a5fa' }}>{tattoos.length} طرح</strong>
              </div>

              <button
                disabled={tattoos.length === 0}
                onClick={() => setStep(3)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: tattoos.length > 0 ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                  color: tattoos.length > 0 ? '#fff' : '#71717a',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: tattoos.length > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  touchAction: 'manipulation'
                }}
              >
                <span>ورود به استودیوی سه‌بعدی</span>
                <ChevronLeft size={15} />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Step 3: Interactive 3D Studio */}
      {step === 3 && (
        <div style={{
          flex: '1 1 0%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          direction: 'ltr',
          position: 'relative'
        }}>

          {/* 1. Main 3D Viewport */}
          <main style={{
            flex: 1,
            height: '100%',
            position: 'relative',
            overflow: 'hidden'
          }}>

            {/* Top Toolbar */}
            <div
              className="horizontal-scroll-bar"
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                zIndex: 30,
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(18, 18, 20, 0.9)',
                backdropFilter: 'blur(12px)',
                padding: '4px 8px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: '11px',
                direction: 'rtl',
                maxWidth: 'calc(100% - 64px)'
              }}
            >
              <button
                onClick={() => setStep(2)}
                style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', padding: '3px 4px' }}
              >
                <ArrowRight size={13} />
                <span>طرح‌ها</span>
              </button>
              <span style={{ color: '#3f3f46' }}>|</span>

              <button
                onClick={handleToggleUVMode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: isUVMode ? 'rgba(147, 51, 234, 0.25)' : 'rgba(255,255,255,0.06)',
                  color: isUVMode ? '#c084fc' : '#a1a1aa',
                  border: '1px solid ' + (isUVMode ? '#9333ea' : 'rgba(255,255,255,0.1)'),
                  padding: '4px 7px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                <Layers size={12} />
                <span>{isUVMode ? 'انحنای عریض' : 'استاندارد'}</span>
              </button>

              {isUVMode && selectedPart.zones && selectedPart.zones.length > 0 && (
                <div style={{ display: 'flex', gap: '2px', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '5px' }}>
                  {selectedPart.zones.map((zone) => (
                    <button
                      key={zone.id}
                      onClick={() => setActiveUVZone(zone.id)}
                      style={{
                        background: activeUVZone === zone.id ? '#9333ea' : 'transparent',
                        color: activeUVZone === zone.id ? '#fff' : '#a1a1aa',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '3px 6px',
                        fontSize: '10px',
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
                style={{ background: 'none', border: 'none', color: showGuide ? '#38bdf8' : '#71717a', cursor: 'pointer', padding: '2px' }}
                title="راهنما"
              >
                <HelpCircle size={14} />
              </button>

              <span style={{ color: '#3f3f46' }}>|</span>

              <button
                onClick={() => setIsPlacingMode(!isPlacingMode)}
                style={{
                  background: isPlacingMode ? '#2563eb' : 'rgba(255,255,255,0.08)',
                  color: isPlacingMode ? '#fff' : '#a1a1aa',
                  border: '1px solid ' + (isPlacingMode ? '#3b82f6' : 'rgba(255,255,255,0.1)'),
                  padding: '4px 7px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap'
                }}
              >
                {isPlacingMode ? '🎯 لمس پوست' : '🔄 چرخش ۳بعدی'}
              </button>
            </div>

            {showGuide && (
              <div style={{
                position: 'absolute',
                top: '46px',
                left: '10px',
                zIndex: 35,
                width: '260px',
                backgroundColor: 'rgba(24, 24, 27, 0.96)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(147, 51, 234, 0.3)',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '11px',
                lineHeight: '1.5',
                color: '#d4d4d8',
                boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
                direction: 'rtl'
              }}>
                <div style={{ fontWeight: '700', color: '#c084fc', marginBottom: '3px' }}>راهنمای استودیو:</div>
                طرح مورد نظر را انتخاب و دکمه «لمس پوست» را فعال کنید، سپس روی پوست مدل کلیک یا لمس کنید تا تتو چسبانده شود.
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
          </main>

          {/* 2. Floating Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            title={isSidebarOpen ? 'بستن پنل تنظیمات' : 'باز کردن پنل تنظیمات'}
            style={{
              position: 'absolute',
              top: '10px',
              right: isSidebarOpen && !isMobileScreen ? '304px' : '10px',
              zIndex: 140,
              background: 'rgba(24, 24, 27, 0.94)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
              transition: 'right 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation'
            }}
          >
            {isSidebarOpen ? <ChevronRight size={18} /> : <Sliders size={16} color="#60a5fa" />}
          </button>

          {/* Backdrop on mobile when sidebar is open */}
          {isSidebarOpen && isMobileScreen && (
            <div
              onClick={() => setIsSidebarOpen(false)}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(4px)',
                zIndex: 110
              }}
            />
          )}

          {/* 3. Responsive Collapsible Controls Sidebar */}
          <aside
            style={{
              position: isMobileScreen ? 'absolute' : 'relative',
              right: 0,
              top: 0,
              width: isSidebarOpen ? (isMobileScreen ? 'min(295px, 85vw)' : '300px') : '0px',
              minWidth: isSidebarOpen && !isMobileScreen ? '300px' : '0px',
              maxWidth: isMobileScreen ? '85vw' : '320px',
              height: '100%',
              backgroundColor: '#121215',
              borderLeft: isSidebarOpen ? '1px solid #1f1f23' : 'none',
              boxShadow: isSidebarOpen && isMobileScreen ? '-8px 0 24px rgba(0,0,0,0.8)' : 'none',
              transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden',
              direction: 'rtl',
              zIndex: 120,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{
              width: isMobileScreen ? 'min(295px, 85vw)' : '300px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden'
            }}>
              {/* Sidebar Header on mobile */}
              {isMobileScreen && (
                <div style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>تنظیمات استودیو</div>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '2px' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Scrollable controls */}
              <div className="scrollable-page" style={{ padding: '10px 12px' }}>

                {/* 1. Tattoo List Accordion */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  marginBottom: '8px',
                  overflow: 'hidden'
                }}>
                  <div
                    onClick={() => setOpenSection(openSection === 'tattoos' ? '' : 'tattoos')}
                    style={{
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: 'rgba(255,255,255,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }}>
                      <ImageIcon size={15} color="#60a5fa" />
                      <span>طرح‌های تتو</span>
                      <span style={{ fontSize: '10px', background: '#27272a', padding: '1px 5px', borderRadius: '8px', color: '#a1a1aa' }}>
                        {tattoos.length}
                      </span>
                    </div>
                    {openSection === 'tattoos' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>

                  {openSection === 'tattoos' && (
                    <div style={{ padding: '10px' }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))',
                        gap: '6px',
                        marginBottom: '8px'
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
                                borderRadius: '8px',
                                backgroundColor: '#ffffff',
                                border: isSelected ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.4)' : 'none',
                                padding: '3px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'all 0.15s ease',
                                overflow: 'hidden',
                                touchAction: 'manipulation'
                              }}
                            >
                              <img
                                src={tattoo.url}
                                alt={tattoo.name}
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                              />
                              {isSelected && (
                                <div style={{ position: 'absolute', top: '2px', right: '2px' }}>
                                  <CheckCircle2 size={11} color="#3b82f6" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Button to open quick gallery picker */}
                      <button
                        onClick={() => setShowGalleryModal(true)}
                        style={{
                          width: '100%',
                          padding: '7px',
                          borderRadius: '6px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px dashed rgba(59, 130, 246, 0.4)',
                          color: '#60a5fa',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          touchAction: 'manipulation'
                        }}
                      >
                        <Plus size={13} />
                        <span>افزودن طرح از گالری</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Transform Settings Accordion */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  marginBottom: '8px',
                  overflow: 'hidden'
                }}>
                  <div
                    onClick={() => setOpenSection(openSection === 'settings' ? '' : 'settings')}
                    style={{
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: 'rgba(255,255,255,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }}>
                      <Sliders size={15} color="#60a5fa" />
                      <span>تنظیمات طرح انتخابی</span>
                    </div>
                    {openSection === 'settings' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>

                  {openSection === 'settings' && (
                    <div style={{ padding: '10px 12px' }}>
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
                            marginTop: '10px',
                            paddingTop: '8px',
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
                        <div style={{ textAlign: 'center', color: '#71717a', fontSize: '11px', padding: '10px 0' }}>
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
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <div
                    onClick={() => setOpenSection(openSection === 'lighting' ? '' : 'lighting')}
                    style={{
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: 'rgba(255,255,255,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }}>
                      <Sun size={15} color="#f59e0b" />
                      <span>نورپردازی استودیو</span>
                    </div>
                    {openSection === 'lighting' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>

                  {openSection === 'lighting' && (
                    <div style={{ padding: '10px 12px' }}>
                      <PhysicsSlider
                        label="زاویه تابش نور"
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
                padding: '10px 12px',
                backgroundColor: '#0c0c0e',
                borderTop: '1px solid #1f1f23',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexShrink: 0
              }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#71717a' }}>سیستم فعال:</div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#f4f4f5' }}>
                    {isUVMode ? 'موضع تطبیقی (عریض)' : 'پروجکشن استاندارد'}
                  </div>
                </div>

                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px',
                  overflow: 'hidden'
                }}>
                  {activeTattoo ? (
                    <img src={activeTattoo.url} alt="طرح فعال" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: '9px', color: '#71717a' }}>خالی</span>
                  )}
                </div>
              </div>
            </div>

          </aside>

          {/* Quick Gallery Picker Modal (while in Step 3) */}
          {showGalleryModal && (
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(8px)',
              zIndex: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
              direction: 'rtl'
            }}
            onClick={() => setShowGalleryModal(false)}
            >
              <div
                style={{
                  backgroundColor: '#121215',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '12px',
                  width: '100%',
                  maxWidth: '700px',
                  maxHeight: '90dvh',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0
                }}>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>افزودن طرح از گالری</div>
                  <button
                    onClick={() => setShowGalleryModal(false)}
                    style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="scrollable-page" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))', gap: '8px' }}>
                    {PRESET_TATTOOS.map((preset) => {
                      const isSelected = tattoos.some((t) => t.id === preset.id);
                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleTogglePresetTattoo(preset)}
                          style={{
                            backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                            border: isSelected ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '10px',
                            padding: '6px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            position: 'relative',
                            touchAction: 'manipulation'
                          }}
                        >
                          <div style={{
                            aspectRatio: '1/1',
                            backgroundColor: '#fff',
                            borderRadius: '6px',
                            padding: '6px',
                            marginBottom: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <img src={getAssetUrl(`tattoos/${preset.filename}`)} alt={preset.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
                          </div>
                          <div style={{ fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {preset.name}
                          </div>
                          {isSelected && (
                            <div style={{ position: 'absolute', top: '4px', left: '4px', background: '#3b82f6', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={10} color="#fff" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                  <button
                    onClick={() => setShowGalleryModal(false)}
                    style={{
                      background: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 16px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    بستن
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Context menu for tattoo deletion */}
          {contextMenu && (
            <div
              style={{
                position: 'fixed',
                top: `${contextMenu.y}px`,
                left: `${contextMenu.x}px`,
                backgroundColor: '#18181b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '4px',
                zIndex: 1000,
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                direction: 'rtl'
              }}
            >
              <button
                onClick={(e) => handleDeleteTattoo(contextMenu.id, e)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  padding: '6px 10px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  width: '100%'
                }}
              >
                <Trash2 size={13} />
                <span>حذف طرح از بوم</span>
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
