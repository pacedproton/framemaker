// Equation Renderer - Renders math equations visually using HTML/CSS
import React from 'react';
import type { EquationNode } from '../engine/EquationEditor';

interface EquationRendererProps {
  equation: EquationNode;
  fontSize?: number;
}

export const EquationRenderer: React.FC<EquationRendererProps> = ({ equation, fontSize = 14 }) => {
  const renderNode = (node: EquationNode): React.ReactNode => {
    if (Array.isArray(node)) {
      return (
        <span className="eq-group">
          {node.map((child, i) => (
            <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
          ))}
        </span>
      );
    }

    switch (node.type) {
      case 'number':
        return <span className="eq-number">{node.value}</span>;

      case 'variable':
        return (
          <span className={`eq-variable ${node.italic ? 'italic' : ''}`}>
            {node.name}
          </span>
        );

      case 'operator':
        return <span className="eq-operator">{node.symbol}</span>;

      case 'function':
        return (
          <span className="eq-function">
            <span className="eq-func-name">{node.name}</span>
            <span className="eq-paren">(</span>
            {renderNode(node.argument)}
            <span className="eq-paren">)</span>
          </span>
        );

      case 'fraction':
        return (
          <span className="eq-fraction">
            <span className="eq-numerator">{renderNode(node.numerator)}</span>
            <span className="eq-frac-line" />
            <span className="eq-denominator">{renderNode(node.denominator)}</span>
          </span>
        );

      case 'superscript':
        return (
          <span className="eq-superscript">
            <span className="eq-base">{renderNode(node.base)}</span>
            <sup className="eq-sup">{renderNode(node.exponent)}</sup>
          </span>
        );

      case 'subscript':
        return (
          <span className="eq-subscript">
            <span className="eq-base">{renderNode(node.base)}</span>
            <sub className="eq-sub">{renderNode(node.subscript)}</sub>
          </span>
        );

      case 'sqrt':
        return (
          <span className="eq-sqrt">
            {node.index && <sup className="eq-root-index">{renderNode(node.index)}</sup>}
            <span className="eq-radical">√</span>
            <span className="eq-radicand">{renderNode(node.radicand)}</span>
          </span>
        );

      case 'sum':
        return (
          <span className="eq-sum">
            <span className="eq-sigma">
              <span className="eq-big-operator">∑</span>
              {node.lower && <sub className="eq-lower">{renderNode(node.lower)}</sub>}
              {node.upper && <sup className="eq-upper">{renderNode(node.upper)}</sup>}
            </span>
            <span className="eq-expression">{renderNode(node.expression)}</span>
          </span>
        );

      case 'product':
        return (
          <span className="eq-product">
            <span className="eq-pi">
              <span className="eq-big-operator">∏</span>
              {node.lower && <sub className="eq-lower">{renderNode(node.lower)}</sub>}
              {node.upper && <sup className="eq-upper">{renderNode(node.upper)}</sup>}
            </span>
            <span className="eq-expression">{renderNode(node.expression)}</span>
          </span>
        );

      case 'integral':
        return (
          <span className="eq-integral">
            <span className="eq-int-sign">
              <span className="eq-big-operator">∫</span>
              {node.lower && <sub className="eq-lower">{renderNode(node.lower)}</sub>}
              {node.upper && <sup className="eq-upper">{renderNode(node.upper)}</sup>}
            </span>
            <span className="eq-integrand">{renderNode(node.integrand)}</span>
            <span className="eq-differential">d{node.variable}</span>
          </span>
        );

      case 'matrix':
        return (
          <span className="eq-matrix">
            <span className="eq-matrix-bracket left">(</span>
            <span className="eq-matrix-content">
              {node.cells.map((row, i) => (
                <span key={i} className="eq-matrix-row">
                  {row.map((cell, j) => (
                    <span key={j} className="eq-matrix-cell">
                      {renderNode(cell)}
                    </span>
                  ))}
                </span>
              ))}
            </span>
            <span className="eq-matrix-bracket right">)</span>
          </span>
        );

      case 'delimiters':
        return (
          <span className="eq-delimiters">
            <span className="eq-left-delim">{node.left}</span>
            {renderNode(node.content)}
            <span className="eq-right-delim">{node.right}</span>
          </span>
        );

      default:
        return null;
    }
  };

  return (
    <span
      className="eq-container"
      style={{
        fontSize: `${fontSize}px`,
        display: 'inline-block',
        fontFamily: 'Times New Roman, serif',
        verticalAlign: 'middle',
      }}
    >
      {renderNode(equation)}
    </span>
  );
};

// CSS styles for equation rendering (to be added to App.css)
export const equationStyles = `
.eq-container {
  display: inline-block;
  vertical-align: middle;
}

.eq-group {
  display: inline;
}

.eq-number {
  font-style: normal;
}

.eq-variable {
  font-style: normal;
}

.eq-variable.italic {
  font-style: italic;
}

.eq-operator {
  padding: 0 3px;
}

.eq-function {
  display: inline;
}

.eq-func-name {
  font-style: normal;
}

.eq-paren {
  font-size: 1.1em;
}

.eq-fraction {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  vertical-align: middle;
  padding: 0 2px;
}

.eq-numerator, .eq-denominator {
  text-align: center;
  padding: 2px 4px;
}

.eq-frac-line {
  width: 100%;
  height: 1px;
  background: currentColor;
}

.eq-superscript, .eq-subscript {
  display: inline;
}

.eq-base {
  display: inline;
}

.eq-sup, .eq-sub {
  font-size: 0.7em;
  vertical-align: baseline;
}

.eq-sup {
  position: relative;
  top: -0.4em;
}

.eq-sub {
  position: relative;
  top: 0.3em;
}

.eq-sqrt {
  display: inline;
  position: relative;
}

.eq-radical {
  font-size: 1.2em;
}

.eq-radicand {
  border-top: 1px solid currentColor;
  padding: 0 3px;
}

.eq-root-index {
  font-size: 0.6em;
  position: relative;
  left: -2px;
}

.eq-sum, .eq-product, .eq-integral {
  display: inline;
}

.eq-big-operator {
  font-size: 1.5em;
  line-height: 1;
}

.eq-sigma .eq-lower,
.eq-pi .eq-lower,
.eq-int-sign .eq-lower {
  font-size: 0.6em;
  display: block;
}

.eq-sigma .eq-upper,
.eq-pi .eq-upper,
.eq-int-sign .eq-upper {
  font-size: 0.6em;
  display: block;
}

.eq-differential {
  font-style: italic;
  padding-left: 3px;
}

.eq-matrix {
  display: inline-flex;
  align-items: center;
}

.eq-matrix-bracket {
  font-size: 2em;
  font-weight: 100;
}

.eq-matrix-content {
  display: inline-flex;
  flex-direction: column;
}

.eq-matrix-row {
  display: flex;
}

.eq-matrix-cell {
  padding: 2px 6px;
  text-align: center;
}

.eq-delimiters {
  display: inline;
}

.eq-left-delim, .eq-right-delim {
  font-size: 1.2em;
}
`;
