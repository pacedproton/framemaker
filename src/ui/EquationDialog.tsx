// Equation Dialog - Insert mathematical equations
import React, { useState } from 'react';
import { equationToLatex, equationTemplates, parseSimpleEquation } from '../engine/EquationEditor';

interface EquationDialogProps {
  visible: boolean;
  onClose: () => void;
  onInsert: (latex: string) => void;
}

export const EquationDialog: React.FC<EquationDialogProps> = ({ visible, onClose, onInsert }) => {
  const [equationText, setEquationText] = useState('');
  const [preview, setPreview] = useState('');

  const handleTextChange = (text: string) => {
    setEquationText(text);
    try {
      const ast = parseSimpleEquation(text);
      const latex = equationToLatex(ast);
      setPreview(latex);
    } catch {
      setPreview('Invalid equation');
    }
  };

  const insertTemplate = (name: keyof typeof equationTemplates) => {
    const template = equationTemplates[name]();
    const latex = equationToLatex(template);
    setPreview(latex);
    setEquationText(latex);
  };

  if (!visible) return null;

  return (
    <div className="fm-dialog-overlay">
      <div className="fm-dialog equation-dialog">
        <div className="dialog-title">Equations</div>

        <div className="dialog-content">
          <div className="equation-templates">
            <div className="template-label">Templates:</div>
            <button onClick={() => insertTemplate('quadratic')}>Quadratic Formula</button>
            <button onClick={() => insertTemplate('pythagorean')}>Pythagorean</button>
            <button onClick={() => insertTemplate('euler')}>Euler's Identity</button>
          </div>

          <div className="equation-input">
            <label>Equation:</label>
            <textarea
              value={equationText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Enter equation, e.g., x^2 + 3x - 5 = 0"
              rows={3}
            />
          </div>

          <div className="equation-preview">
            <label>Preview (LaTeX):</label>
            <div className="preview-box">{preview || 'Type an equation above'}</div>
          </div>

          <div className="equation-symbols">
            <div className="symbol-label">Symbols:</div>
            <div className="symbol-grid">
              {['α', 'β', 'γ', 'δ', 'ε', 'θ', 'λ', 'μ', 'π', 'σ', 'φ', 'ω'].map((sym) => (
                <button key={sym} onClick={() => setEquationText((prev) => prev + sym)}>
                  {sym}
                </button>
              ))}
              {['∫', '∑', '∏', '√', '∞', '≠', '≤', '≥', '±', '÷', '×', '∂'].map((sym) => (
                <button key={sym} onClick={() => setEquationText((prev) => prev + sym)}>
                  {sym}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="dialog-buttons">
          <button onClick={() => onInsert(preview)}>Insert</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
