// Equation Dialog - Insert mathematical equations
import React, { useState } from 'react';
import {
  equationToLatex,
  equationTemplates,
  parseSimpleEquation,
  type EquationNode,
} from '../engine/EquationEditor';
import { EquationRenderer } from '../render/EquationRenderer';

interface EquationDialogProps {
  visible: boolean;
  onClose: () => void;
  onInsert: (latex: string) => void;
}

export const EquationDialog: React.FC<EquationDialogProps> = ({ visible, onClose, onInsert }) => {
  const [equationText, setEquationText] = useState('');
  const [preview, setPreview] = useState('');
  const [ast, setAst] = useState<EquationNode | null>(null);

  const handleTextChange = (text: string) => {
    setEquationText(text);
    try {
      const parsedAst = parseSimpleEquation(text);
      const latex = equationToLatex(parsedAst);
      setPreview(latex);
      setAst(parsedAst);
    } catch {
      setPreview('Invalid equation');
      setAst(null);
    }
  };

  const insertTemplate = (name: keyof typeof equationTemplates) => {
    const template = equationTemplates[name]();
    const latex = equationToLatex(template);
    setPreview(latex);
    setEquationText(latex);
    setAst(template);
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
            <label>Visual Preview:</label>
            <div className="equation-visual-preview">
              {ast ? (
                <EquationRenderer equation={ast} fontSize={18} />
              ) : (
                <span style={{ color: '#808080' }}>Type an equation above or select a template</span>
              )}
            </div>
          </div>

          <div className="equation-preview">
            <label>LaTeX Output:</label>
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
