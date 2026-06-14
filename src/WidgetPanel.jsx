import React, { useState, useEffect, useRef } from 'react';
import { GripHorizontal, Minimize2, Maximize2, X } from 'lucide-react';

const MIN_WIDTH = 150;
const MIN_HEIGHT = 50;

export default function WidgetPanel({ title, children, defaultPosition, defaultSize, isLocked, zIndex = 10 }) {
  const [position, setPosition] = useState(defaultPosition || { x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, currentX: position.x, currentY: position.y });

  // --- Resize state ---
  const [size, setSize] = useState(defaultSize ? { w: defaultSize.w, h: defaultSize.h } : null);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef({ startX: 0, startY: 0, startW: 0, startH: 0 });

  // --- Close / Minimize state ---
  const [isHidden, setIsHidden] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // ========== DRAG LOGIC (preserved exactly) ==========
  const handleMouseDown = (e) => {
    if (isLocked) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      currentX: position.x,
      currentY: position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.currentX + dx,
        y: dragRef.current.currentY + dy
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // ========== RESIZE LOGIC ==========
  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);

    const currentW = size ? size.w : (e.target.closest('[data-widget-panel]')?.offsetWidth || 300);
    const currentH = size ? size.h : (e.target.closest('[data-widget-panel]')?.offsetHeight || 200);

    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: currentW,
      startH: currentH
    };
  };

  useEffect(() => {
    const handleResizeMove = (e) => {
      if (!isResizing) return;
      const dx = e.clientX - resizeRef.current.startX;
      const dy = e.clientY - resizeRef.current.startY;
      setSize({
        w: Math.max(MIN_WIDTH, resizeRef.current.startW + dx),
        h: Math.max(MIN_HEIGHT, resizeRef.current.startH + dy)
      });
    };

    const handleResizeUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeUp);
    };
  }, [isResizing]);

  // ========== RENDER ==========
  if (isHidden) return null;

  return (
    <div
      data-widget-panel
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: isDragging || isResizing ? 100 : zIndex,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
        transition: isDragging || isResizing ? 'none' : 'box-shadow 0.2s ease',
        boxShadow: isDragging
          ? '0 15px 40px rgba(0,0,0,0.6)'
          : '0 4px 20px rgba(0,0,0,0.3)',
        borderRadius: '12px',
        overflow: 'hidden',
        ...(size ? { width: `${size.w}px`, height: isMinimized ? 'auto' : `${size.h}px` } : {}),
        ...(isMinimized ? { height: 'auto' } : {})
      }}
    >
      {/* ===== TITLE BAR ===== */}
      {!isLocked && (
        <div
          onMouseDown={handleMouseDown}
          style={{
            height: '32px',
            minHeight: '32px',
            background: 'linear-gradient(180deg, rgba(60,60,80,0.85) 0%, rgba(30,30,45,0.9) 100%)',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '0 6px 0 10px',
            userSelect: 'none',
            gap: '6px'
          }}
        >
          {/* Left: grip icon + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1 }}>
            <GripHorizontal size={12} color="var(--text-muted, #888)" style={{ flexShrink: 0, opacity: 0.6 }} />
            {title && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-secondary, #ccc)',
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {title}
              </span>
            )}
          </div>

          {/* Right: minimize + close buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            {/* Minimize / Restore button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized((prev) => !prev);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title={isMinimized ? 'Restore' : 'Minimize'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted, #888)',
                transition: 'background 0.15s ease, color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = 'var(--text-primary, #fff)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = 'var(--text-muted, #888)';
              }}
            >
              {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
            </button>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsHidden(true);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="Close"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted, #888)',
                transition: 'background 0.15s ease, color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,80,80,0.25)';
                e.currentTarget.style.color = '#ff6b6b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = 'var(--text-muted, #888)';
              }}
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* ===== CONTENT AREA ===== */}
      {!isMinimized && (
        <div
          style={{
            borderTopLeftRadius: isLocked ? '12px' : '0',
            borderTopRightRadius: isLocked ? '12px' : '0',
            flex: 1,
            overflow: 'auto',
            position: 'relative'
          }}
        >
          {children}
        </div>
      )}

      {/* ===== RESIZE HANDLE ===== */}
      {!isLocked && !isMinimized && (
        <div
          onMouseDown={handleResizeMouseDown}
          title="Resize"
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '18px',
            height: '18px',
            cursor: 'nwse-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            borderRadius: '0 0 12px 0',
            background: 'transparent'
          }}
        >
          {/* Diagonal resize dots */}
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            style={{ opacity: 0.4, pointerEvents: 'none' }}
          >
            <circle cx="8" cy="2" r="1" fill="var(--text-muted, #888)" />
            <circle cx="8" cy="5.5" r="1" fill="var(--text-muted, #888)" />
            <circle cx="4.5" cy="5.5" r="1" fill="var(--text-muted, #888)" />
            <circle cx="8" cy="9" r="1" fill="var(--text-muted, #888)" />
            <circle cx="4.5" cy="9" r="1" fill="var(--text-muted, #888)" />
            <circle cx="1" cy="9" r="1" fill="var(--text-muted, #888)" />
          </svg>
        </div>
      )}
    </div>
  );
}
