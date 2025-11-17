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

      // Major tick with label
      const tickHeight = orientation === 'horizontal' ? 12 : undefined;
      const tickWidth = orientation === 'vertical' ? 12 : undefined;

      ticks.push(
        <div
          key={`major-${i}`}
          className="ruler-tick major"
          style={{
            [orientation === 'horizontal' ? 'left' : 'top']: `${pos}px`,
            [orientation === 'horizontal' ? 'height' : 'width']: tickHeight || tickWidth,
          }}
        />
      );

      // Label
      ticks.push(
        <div
          key={`label-${i}`}
          className="ruler-label"
          style={{
            [orientation === 'horizontal' ? 'left' : 'top']: `${pos}px`,
          }}
        >
          {i}
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
                [orientation === 'horizontal' ? 'height' : 'width']: isHalfTick ? 8 : 4,
              }}
            />
          );
        }
      }
    }

    return ticks;
  };

  return (
    <div className={`fm-ruler ${orientation}`}>
      {renderTicks()}
    </div>
  );
};

// Ruler corner (where horizontal and vertical rulers meet)
export const RulerCorner: React.FC = () => {
  const state = useStore();

  return (
    <div className="fm-ruler-corner">
      {state.document.settings.units}
    </div>
  );
};
