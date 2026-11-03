import React, { useState, useRef, useEffect } from 'react';
import Canvas3D from './Canvas3D';
import TattooExtractor from './TattooExtractor';
import {
  Sparkles,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ArrowRight,
  Image as ImageIcon,
  Sliders,
  CheckCircle2,
  X
} from 'lucide-react';

const BODY_PARTS = [
  { id: 'arm_right', name: 'دست راست', path: '/models/body_parts/arm_right.glb', icon: '💪', ready: true },
  { id: 'arm_left', name: 'دست چپ', path: '/models/body_parts/arm_left.glb', icon: '💪', ready: false },
  { id: 'leg_right', name: 'پای راست', path: '/models/body_parts/leg_right.glb', icon: '🦵', ready: false },
  { id: 'leg_left', name: 'پای چپ', path: '/models/body_parts/leg_left.glb', icon: '🦵', ready: false },
  { id: 'head', name: 'سر', path: '/models/body_parts/head.glb', icon: '👤', ready: false },
  { id: 'torso', name: 'نیم‌تنه بالا', path: '/models/body_parts/torso.glb', icon: '👕', ready: false },
  { id: 'full_body', name: 'بدن کامل', path: '/models/body_parts/full_body.glb', icon: '🧍', ready: false },
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
    <div style={{ marginBottom: '18px', userSelect: 'none' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: '#a1a1aa',
        marginBottom: '8px',
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
              bottom: '24px',
              left: `${percentage}%`,
              transform: `translateX(-50%) rotate(${tilt}deg)`,
              transformOrigin: 'bottom center',
              transition: 'transform 0.05s ease-out',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '700',
              padding: '3px 8px',
              borderRadius: '7px',
              boxShadow: '0 6px 14px rgba(59, 130, 246, 0.45)',
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

  const [openSection, setOpenSection] = useState('tattoos');
  const [contextMenu, setContextMenu] = useState(null);
  const longPressTimerRef = useRef(null);

  const [tattooTransforms, setTattooTransforms] = useState({});

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

  const handlePlaceTattoo = (point, normal) => {
    if (!selectedTattooId) return;
    setTattoos((prev) =>
      prev.map((t) =>
        t.id === selectedTattooId ? { ...t, position: point, normal: normal } : t
      )
    );
  };

  const handleFileUpload = (files) => {
    const newItems = Array.from(files).filter(f => f.type.startsWith('image/')).map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      url: URL.createObjectURL(file)
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
        direction: 'rtl'
      }}
      onClick={() => setContextMenu(null)}
    >
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

      {/* ================= مرحله ۱: انتخاب عضو بدن ================= */}
      {step === 1 && (
        <div style={{ flex: 1, padding: '40px 24px', overflowY: 'auto', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '35px' }}>
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
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>
              کدام بخش از بدن را می‌خواهید؟
            </h1>
            <p style={{ color: '#71717a', fontSize: '14px' }}>
              عضو مورد نظر خود را برای شروع انتخاب نمایید.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
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
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px'
                  }}>
                    {part.icon}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>
                        {part.name}
                      </h3>
                      {part.ready && (
                        <span style={{ fontSize: '10px', background: '#10b981', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
                          آماده
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronLeft size={18} color="#71717a" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= مرحله ۲: ایمپورت و آپلود طرح‌ها ================= */}
      {step === 2 && (
        <div style={{ flex: 1, padding: '40px 24px', maxWidth: '750px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
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

          <div style={{ marginBottom: '24px' }}>
            <TattooExtractor
              onUseDesign={(file) => handleFileUpload([file])}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '12px' }}>
              طرح‌های وارد شده ({tattoos.length}):
            </div>
            {tattoos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#52525b', fontSize: '13px' }}>
                هنوز هیچ طرحی اضافه نشده است.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '12px' }}>
                {tattoos.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      position: 'relative',
                      aspectRatio: '1/1',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: selectedTattooId === t.id ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img src={t.url} alt={t.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    <button
                      onClick={(e) => handleDeleteTattoo(t.id, e)}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        left: '-6px',
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
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
              padding: '14px',
              borderRadius: '12px',
              background: tattoos.length > 0 ? '#3b82f6' : 'rgba(255,255,255,0.08)',
              color: tattoos.length > 0 ? '#fff' : '#71717a',
              border: 'none',
              fontWeight: '700',
              fontSize: '15px',
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

      {/* ================= مرحله ۳: ابزار و استودیوی سه‌بعدی ================= */}
      {step === 3 && (
        <div style={{ flex: 1, display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
          {/* سمت چپ: کادر سه‌بعدی */}
          <div style={{ width: '66.666%', height: '100%', position: 'relative', borderLeft: '1px solid #1f1f23' }}>
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(18, 18, 20, 0.75)',
              backdropFilter: 'blur(10px)',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '13px'
            }}>
              <button
                onClick={() => setStep(2)}
                style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <ArrowRight size={15} />
                <span>افزودن طرح</span>
              </button>
              <span style={{ color: '#3f3f46' }}>|</span>
              <span style={{ color: '#d4d4d8' }}>عضو: {selectedPart.name}</span>
              <span style={{ color: '#3f3f46' }}>|</span>

              <button
                onClick={() => setIsPlacingMode(!isPlacingMode)}
                style={{
                  background: isPlacingMode ? '#2563eb' : 'rgba(255,255,255,0.08)',
                  color: isPlacingMode ? '#fff' : '#a1a1aa',
                  border: '1px solid ' + (isPlacingMode ? '#3b82f6' : 'rgba(255,255,255,0.1)'),
                  padding: '5px 10px',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
              >
                {isPlacingMode ? '🎯 لمس پوست (فعال)' : '🔄 چرخش ۳بعدی'}
              </button>
            </div>

            <Canvas3D
              modelPath={selectedPart.path}
              tattoos={tattoos}
              tattooTransforms={tattooTransforms}
              selectedTattooId={selectedTattooId}
              isPlacingMode={isPlacingMode}
              onPlaceTattoo={handlePlaceTattoo}
              onUpdateTransform={updateTransform}
            />
          </div>

          {/* سمت راست: سایدبار ابزارها */}
          <div style={{
            width: '33.333%',
            height: '100%',
            backgroundColor: '#121215',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRight: '1px solid #1f1f23'
          }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

              {/* منوی ۱: طرح‌های تتو */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '14px',
                marginBottom: '12px',
                overflow: 'hidden'
              }}>
                <div
                  onClick={() => setOpenSection(openSection === 'tattoos' ? '' : 'tattoos')}
                  style={{
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700' }}>
                    <ImageIcon size={17} color="#60a5fa" />
                    <span>طرح‌های تتو</span>
                    <span style={{ fontSize: '11px', background: '#27272a', padding: '2px 7px', borderRadius: '10px', color: '#a1a1aa' }}>
                      {tattoos.length}
                    </span>
                  </div>
                  {openSection === 'tattoos' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                {openSection === 'tattoos' && (
                  <div style={{ padding: '14px' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))',
                      gap: '10px'
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
                              borderRadius: '12px',
                              background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                              backdropFilter: 'blur(10px)',
                              border: isSelected ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                              boxShadow: isSelected ? '0 0 14px rgba(59, 130, 246, 0.3)' : 'none',
                              padding: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <img
                              src={tattoo.url}
                              alt={tattoo.name}
                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                            />
                            {isSelected && (
                              <div style={{ position: 'absolute', top: '4px', right: '4px' }}>
                                <CheckCircle2 size={13} color="#3b82f6" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p style={{ fontSize: '11px', color: '#52525b', marginTop: '10px', textAlign: 'center' }}>
                      راست‌کلیک (در پی‌سی) یا لمس طولانی (در گوشی) برای حذف طرح
                    </p>
                  </div>
                )}
              </div>

              {/* منوی ۲: تنظیمات طرح انتخاب شده */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '14px',
                overflow: 'hidden'
              }}>
                <div
                  onClick={() => setOpenSection(openSection === 'settings' ? '' : 'settings')}
                  style={{
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700' }}>
                    <Sliders size={17} color="#60a5fa" />
                    <span>تنظیمات طرح انتخاب شده</span>
                  </div>
                  {openSection === 'settings' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                {openSection === 'settings' && (
                  <div style={{ padding: '16px' }}>
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
                          marginTop: '20px',
                          paddingTop: '16px',
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
                      <div style={{ textAlign: 'center', color: '#71717a', fontSize: '12px', padding: '16px 0' }}>
                        ابتدا یک طرح را از منوی بالا انتخاب کنید.
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* بخش پایین سایدبار */}
            <div style={{
              padding: '16px',
              backgroundColor: '#0c0c0e',
              borderTop: '1px solid #1f1f23',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#71717a' }}>وضعیت:</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#f4f4f5' }}>طرح انتخاب شده</div>
              </div>

              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px'
              }}>
                {activeTattoo ? (
                  <img src={activeTattoo.url} alt="طرح فعال" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: '10px', color: '#52525b' }}>خالی</span>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}