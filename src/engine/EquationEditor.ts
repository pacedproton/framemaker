// Equation Editor - Math equation support
// Based on FrameMaker's equation editor (shrink-wrap equations)

export interface EquationElement {
  type: 'number' | 'variable' | 'operator' | 'function' | 'fraction' | 'superscript' | 'subscript' | 'sqrt' | 'sum' | 'product' | 'integral' | 'matrix' | 'delimiters';
}

export interface NumberElement extends EquationElement {
  type: 'number';
  value: string;
}

export interface VariableElement extends EquationElement {
  type: 'variable';
  name: string;
  italic: boolean;
}

export interface OperatorElement extends EquationElement {
  type: 'operator';
  symbol: string; // +, -, *, /, =, <, >, ≤, ≥, ≠, ±, ∓
}

export interface FunctionElement extends EquationElement {
  type: 'function';
  name: string; // sin, cos, tan, log, ln, exp, lim
  argument: EquationNode;
}

export interface FractionElement extends EquationElement {
  type: 'fraction';
  numerator: EquationNode;
  denominator: EquationNode;
}

export interface SuperscriptElement extends EquationElement {
  type: 'superscript';
  base: EquationNode;
  exponent: EquationNode;
}

export interface SubscriptElement extends EquationElement {
  type: 'subscript';
  base: EquationNode;
  subscript: EquationNode;
}

export interface SqrtElement extends EquationElement {
  type: 'sqrt';
  index?: EquationNode; // For nth root
  radicand: EquationNode;
}

export interface SumElement extends EquationElement {
  type: 'sum';
  lower?: EquationNode;
  upper?: EquationNode;
  expression: EquationNode;
}

export interface ProductElement extends EquationElement {
  type: 'product';
  lower?: EquationNode;
  upper?: EquationNode;
  expression: EquationNode;
}

export interface IntegralElement extends EquationElement {
  type: 'integral';
  lower?: EquationNode;
  upper?: EquationNode;
  integrand: EquationNode;
  variable: string;
}

export interface MatrixElement extends EquationElement {
  type: 'matrix';
  rows: number;
  cols: number;
  cells: EquationNode[][];
}

export interface DelimitersElement extends EquationElement {
  type: 'delimiters';
  left: string; // (, [, {, |, ⌊, ⌈
  right: string; // ), ], }, |, ⌋, ⌉
  content: EquationNode;
}

export type EquationNode =
  | NumberElement
  | VariableElement
  | OperatorElement
  | FunctionElement
  | FractionElement
  | SuperscriptElement
  | SubscriptElement
  | SqrtElement
  | SumElement
  | ProductElement
  | IntegralElement
  | MatrixElement
  | DelimitersElement
  | EquationNode[];

export interface Equation {
  id: string;
  root: EquationNode;
  fontSize: number;
  color: string;
}

// Render equation to LaTeX string (for display)
export function equationToLatex(node: EquationNode): string {
  if (Array.isArray(node)) {
    return node.map(equationToLatex).join(' ');
  }

  switch (node.type) {
    case 'number':
      return node.value;

    case 'variable':
      return node.italic ? `{${node.name}}` : `\\text{${node.name}}`;

    case 'operator':
      const opMap: Record<string, string> = {
        '+': '+',
        '-': '-',
        '*': '\\cdot',
        '×': '\\times',
        '/': '/',
        '=': '=',
        '<': '<',
        '>': '>',
        '≤': '\\leq',
        '≥': '\\geq',
        '≠': '\\neq',
        '±': '\\pm',
        '∓': '\\mp',
      };
      return opMap[node.symbol] || node.symbol;

    case 'function':
      return `\\${node.name}(${equationToLatex(node.argument)})`;

    case 'fraction':
      return `\\frac{${equationToLatex(node.numerator)}}{${equationToLatex(node.denominator)}}`;

    case 'superscript':
      return `{${equationToLatex(node.base)}}^{${equationToLatex(node.exponent)}}`;

    case 'subscript':
      return `{${equationToLatex(node.base)}}_{${equationToLatex(node.subscript)}}`;

    case 'sqrt':
      if (node.index) {
        return `\\sqrt[${equationToLatex(node.index)}]{${equationToLatex(node.radicand)}}`;
      }
      return `\\sqrt{${equationToLatex(node.radicand)}}`;

    case 'sum':
      let sum = '\\sum';
      if (node.lower) sum += `_{${equationToLatex(node.lower)}}`;
      if (node.upper) sum += `^{${equationToLatex(node.upper)}}`;
      return `${sum} ${equationToLatex(node.expression)}`;

    case 'product':
      let prod = '\\prod';
      if (node.lower) prod += `_{${equationToLatex(node.lower)}}`;
      if (node.upper) prod += `^{${equationToLatex(node.upper)}}`;
      return `${prod} ${equationToLatex(node.expression)}`;

    case 'integral':
      let intg = '\\int';
      if (node.lower) intg += `_{${equationToLatex(node.lower)}}`;
      if (node.upper) intg += `^{${equationToLatex(node.upper)}}`;
      return `${intg} ${equationToLatex(node.integrand)} \\, d${node.variable}`;

    case 'matrix':
      const rows = node.cells
        .map((row) => row.map(equationToLatex).join(' & '))
        .join(' \\\\ ');
      return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;

    case 'delimiters':
      const leftMap: Record<string, string> = {
        '(': '(',
        '[': '[',
        '{': '\\{',
        '|': '|',
        '⌊': '\\lfloor',
        '⌈': '\\lceil',
      };
      const rightMap: Record<string, string> = {
        ')': ')',
        ']': ']',
        '}': '\\}',
        '|': '|',
        '⌋': '\\rfloor',
        '⌉': '\\rceil',
      };
      return `\\left${leftMap[node.left] || node.left} ${equationToLatex(node.content)} \\right${rightMap[node.right] || node.right}`;

    default:
      return '';
  }
}

// Parse simple equation syntax to AST
// Example: "x^2 + 3x - 5 = 0"
export function parseSimpleEquation(input: string): EquationNode {
  const tokens: EquationNode[] = [];

  let i = 0;
  while (i < input.length) {
    const char = input[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Number
    if (/[0-9.]/.test(char)) {
      let num = '';
      while (i < input.length && /[0-9.]/.test(input[i])) {
        num += input[i];
        i++;
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }

    // Variable (single letter)
    if (/[a-zA-Z]/.test(char)) {
      tokens.push({ type: 'variable', name: char, italic: true });
      i++;

      // Check for superscript
      if (i < input.length && input[i] === '^') {
        i++;
        const base = tokens.pop()!;
        let exp = '';
        if (input[i] === '{') {
          // Find matching }
          i++;
          while (i < input.length && input[i] !== '}') {
            exp += input[i];
            i++;
          }
          i++; // skip }
        } else {
          exp = input[i];
          i++;
        }
        tokens.push({
          type: 'superscript',
          base,
          exponent: { type: 'number', value: exp },
        });
      }

      // Check for subscript
      if (i < input.length && input[i] === '_') {
        i++;
        const base = tokens.pop()!;
        let sub = '';
        if (input[i] === '{') {
          i++;
          while (i < input.length && input[i] !== '}') {
            sub += input[i];
            i++;
          }
          i++;
        } else {
          sub = input[i];
          i++;
        }
        tokens.push({
          type: 'subscript',
          base,
          subscript: { type: 'number', value: sub },
        });
      }

      continue;
    }

    // Operators
    if (/[+\-*\/=<>]/.test(char)) {
      tokens.push({ type: 'operator', symbol: char });
      i++;
      continue;
    }

    i++;
  }

  return tokens;
}

// Calculate equation bounding box (for shrink-wrap)
export function calculateEquationSize(
  equation: Equation
): { width: number; height: number } {
  // Simplified size calculation
  // In real implementation, would measure actual rendered equation
  const latexStr = equationToLatex(equation.root);
  const charWidth = equation.fontSize * 0.6;
  const lineHeight = equation.fontSize * 1.2;

  // Estimate based on LaTeX length (very rough)
  const effectiveLength = latexStr.replace(/\\[a-z]+/g, 'X').length;

  return {
    width: effectiveLength * charWidth,
    height: lineHeight,
  };
}

// Create a simple equation from text
export function createEquation(text: string, fontSize: number = 12): Equation {
  return {
    id: `eq_${Date.now()}`,
    root: parseSimpleEquation(text),
    fontSize,
    color: '#000000',
  };
}

// Common equation templates
export const equationTemplates = {
  quadratic: (): EquationNode => ({
    type: 'fraction',
    numerator: [
      { type: 'operator', symbol: '-' },
      { type: 'variable', name: 'b', italic: true },
      { type: 'operator', symbol: '±' },
      {
        type: 'sqrt',
        radicand: [
          {
            type: 'superscript',
            base: { type: 'variable', name: 'b', italic: true },
            exponent: { type: 'number', value: '2' },
          },
          { type: 'operator', symbol: '-' },
          { type: 'number', value: '4' },
          { type: 'variable', name: 'a', italic: true },
          { type: 'variable', name: 'c', italic: true },
        ],
      },
    ],
    denominator: [
      { type: 'number', value: '2' },
      { type: 'variable', name: 'a', italic: true },
    ],
  }),

  pythagorean: (): EquationNode => [
    {
      type: 'superscript',
      base: { type: 'variable', name: 'a', italic: true },
      exponent: { type: 'number', value: '2' },
    },
    { type: 'operator', symbol: '+' },
    {
      type: 'superscript',
      base: { type: 'variable', name: 'b', italic: true },
      exponent: { type: 'number', value: '2' },
    },
    { type: 'operator', symbol: '=' },
    {
      type: 'superscript',
      base: { type: 'variable', name: 'c', italic: true },
      exponent: { type: 'number', value: '2' },
    },
  ],

  euler: (): EquationNode => [
    {
      type: 'superscript',
      base: { type: 'variable', name: 'e', italic: true },
      exponent: [
        { type: 'variable', name: 'i', italic: true },
        { type: 'variable', name: 'π', italic: false },
      ],
    },
    { type: 'operator', symbol: '+' },
    { type: 'number', value: '1' },
    { type: 'operator', symbol: '=' },
    { type: 'number', value: '0' },
  ],
};
