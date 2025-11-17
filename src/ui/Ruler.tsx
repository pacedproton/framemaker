// Ruler component - horizontal and vertical rulers
import React from 'react';
import { useStore } from '../document/store';

interface RulerProps {
  orientation: 'horizontal' | 'vertical';
}

export const Ruler: React.FC<RulerProps> = ({ orientation }) => {
  const state = useStore();
  const { pageSize, settings } = state.document;
  const scale = state.zoom / 100;

  const rulerLength = orientation === 'horizontal' ? pageSize.width : pageSize.height;
  const tickInterval = settings.units === 'in' ? 72 : settings.units === 'cm' ? 28.35 : 72;
  const subTickCount = settings.units === 'in' ? 8 : 10;

  const renderTicks = () => {
    const ticks: React.ReactElement[] = [];
    const majorTickCount = Math.ceil(rulerLength / tickInterval);

    for (let i = 0; i <= majorTickCount; i++) {
      const pos = i * tickInterval * scale;

      // Major tick
      ticks.push(
        <div
          key={`major-${i}`}
          className="ruler-tick major"
          style={{
            [orientation === 'horizontal' ? 'left' : 'top']: `${pos}px`,
          }}
        >
          <span className="tick-label">{i}</span>
        </div>
      );

      // Sub-ticks
      if (i < majorTickCount) {
        for (let j = 1; j < subTickCount; j++) {
          const subPos = pos + (j * tickInterval * scale) / subTickCount;
          const isHalfTick = j === subTickCount / 2;
          ticks.push(
            <div
              key={`minor-${i}-${j}`}
              className={`ruler-tick ${isHalfTick ? 'half' : 'minor'}`}
              style={{
                [orientation === 'horizontal' ? 'left' : 'top']: `${subPos}px`,
              }}
            />
          );
        }
      }
    }

    return ticks;
  };

  const rulerStyle: React.CSSProperties =
    orientation === 'horizontal'
      ? {
          position: 'absolute',
          top: 0,
          left: 30, // Leave space for vertical ruler corner
          width: `${rulerLength * scale}px`,
          height: '24px',
          backgroundColor: '#f0f0f0',
          borderBottom: '1px solid #ccc',
          overflow: 'hidden',
        }
      : {
          position: 'absolute',
          top: 24, // Below horizontal ruler
          left: 0,
          width: '30px',
          height: `${rulerLength * scale}px`,
          backgroundColor: '#f0f0f0',
          borderRight: '1px solid #ccc',
          overflow: 'hidden',
        };

  return (
    <div className={`fm-ruler fm-ruler-${orientation}`} style={rulerStyle}>
      {renderTicks()}
    </div>
  );
};

// Ruler corner (where horizontal and vertical rulers meet)
export const RulerCorner: React.FC = () => {
  const state = useStore();

  return (
    <div
      className="fm-ruler-corner"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '30px',
        height: '24px',
        backgroundColor: '#f0f0f0',
        borderBottom: '1px solid #ccc',
        borderRight: '1px solid #ccc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '9px',
        color: '#666',
      }}
    >
      {state.document.settings.units}
    </div>
  );
};
