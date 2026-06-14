import React, { useState, useEffect, useRef } from 'react';
import { GripHorizontal } from 'lucide-react';

export default function WidgetPanel({ title, children, defaultPosition, isLocked, zIndex = 10 }) {
  const [position, setPosition] = useState(defaultPosition || { x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, currentX: position.x, currentY: position.y });

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

  return (
    <div 
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: isDragging ? 100 : zIndex,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
        boxShadow: isDragging ? '0 15px 40px rgba(0,0,0,0.6)' : 'none'
      }}
    >
      {!isLocked && (
        <div 
          onMouseDown={handleMouseDown}
          style={{
            height: '24px',
            backgroundColor: 'rgba(0,0,0,0.4)',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <GripHorizontal size={14} color="var(--text-muted)" />
        </div>
      )}
      <div style={{
        borderTopLeftRadius: isLocked ? '12px' : '0',
        borderTopRightRadius: isLocked ? '12px' : '0'
      }}>
        {children}
      </div>
    </div>
  );
}
