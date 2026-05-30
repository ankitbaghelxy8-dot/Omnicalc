/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CalculatorMode } from '../types';

/**
 * A safe, precise mathematical expression evaluator.
 * Supports standard operations, scientific functions, constants, and nested parenthesis.
 */
export class MathParser {
  private mode: CalculatorMode;

  constructor(mode: CalculatorMode = 'radian') {
    this.mode = mode;
  }

  setMode(mode: CalculatorMode) {
    this.mode = mode;
  }

  /**
   * Helper to compute factorial
   */
  private factorial(n: number): number {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  /**
   * Clean expression for parsing
   */
  private preprocess(expr: string): string {
    let clean = expr
      .replace(/[\s]/g, '') // Remove spaces
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'Math.PI')
      .replace(/e/g, 'Math.E');

    // Handle implicit multiplication: e.g., "5(2)" => "5*(2)", "Math.PI(2)" => "Math.PI*(2)", ")3" => ")*3", "5Math.PI" => "5*Math.PI"
    // Regex for: number/constant/bracket followed by bracket/constant/function
    // We can do this in steps
    clean = clean.replace(/(\d|\)|Math\.PI|Math\.E)(Math\.PI|Math\.E|\(|sin|cos|tan|log|ln|sqrt|abs)/g, '$1*$2');

    return clean;
  }

  /**
   * Safe math parser using standard evaluation tokens.
   */
  evaluate(expr: string): number {
    const rawExpr = this.preprocess(expr);
    if (!rawExpr) return 0;

    let index = 0;

    const peek = () => rawExpr[index];
    const consume = () => rawExpr[index++];

    const parseNumberOrFunction = (): number => {
      let char = peek();
      if (!char) return NaN;

      // Unary operators
      if (char === '-') {
        consume();
        return -parseNumberOrFunction();
      }
      if (char === '+') {
        consume();
        return parseNumberOrFunction();
      }

      // Parenthesis
      if (char === '(') {
        consume(); // '('
        const value = parseExpression();
        if (peek() === ')') {
          consume(); // ')'
        }
        return value;
      }

      // Check constants or functions
      if (/[A-Za-z_]/.test(char)) {
        let name = '';
        while (peek() && /[A-Za-z_0-9.]/.test(peek())) {
          name += consume();
        }

        // Constants
        if (name === 'Math.PI' || name === 'PI') {
          return Math.PI;
        }
        if (name === 'Math.E' || name === 'E') {
          return Math.E;
        }

        // Functions
        if (peek() === '(') {
          consume(); // '('
          const arg = parseExpression();
          if (peek() === ')') {
            consume(); // ')'
          }

          // Evaluate scientific functions based on Degree/Radian mode
          switch (name) {
            case 'sin':
              return Math.sin(this.mode === 'degree' ? (arg * Math.PI) / 180 : arg);
            case 'cos':
              return Math.cos(this.mode === 'degree' ? (arg * Math.PI) / 180 : arg);
            case 'tan': {
              const rad = this.mode === 'degree' ? (arg * Math.PI) / 180 : arg;
              // Avoid exact tan(90) returning infinity or large garbage
              if (Math.abs(Math.cos(rad)) < 1e-15) return NaN;
              return Math.tan(rad);
            }
            case 'asin': {
              const val = Math.asin(arg);
              return this.mode === 'degree' ? (val * 180) / Math.PI : val;
            }
            case 'acos': {
              const val = Math.acos(arg);
              return this.mode === 'degree' ? (val * 180) / Math.PI : val;
            }
            case 'atan': {
              const val = Math.atan(arg);
              return this.mode === 'degree' ? (val * 180) / Math.PI : val;
            }
            case 'log':
              return Math.log10(arg);
            case 'ln':
              return Math.log(arg);
            case 'sqrt':
              return Math.sqrt(arg);
            case 'cbrt':
              return Math.cbrt(arg);
            case 'abs':
              return Math.abs(arg);
            default:
              return NaN;
          }
        }
        return NaN;
      }

      // Standard Number
      if (/[0-9.]/.test(char)) {
        let numStr = '';
        while (peek() && /[0-9.]/.test(peek())) {
          numStr += consume();
        }
        return parseFloat(numStr);
      }

      return NaN;
    };

    // Factorials and Power suffixes (postfix higher precedence)
    const parseFactorialOrPowerSuffix = (): number => {
      let val = parseNumberOrFunction();
      while (peek() === '!') {
        consume();
        val = this.factorial(val);
      }
      return val;
    };

    // Powers (exponentiation: Right-associative or Left-associative depending on operator ^)
    const parsePowers = (): number => {
      let val = parseFactorialOrPowerSuffix();
      while (peek() === '^') {
        consume();
        const exponent = parsePowers(); // Parse recursively for right-associativity: 2^3^2 = 2^(3^2)
        val = Math.pow(val, exponent);
      }
      return val;
    };

    // Multiplication / Division
    const parseMultiplication = (): number => {
      let val = parsePowers();
      while (peek() === '*' || peek() === '/') {
        const op = consume();
        const nextVal = parsePowers();
        if (op === '*') {
          val *= nextVal;
        } else {
          val /= nextVal;
        }
      }
      return val;
    };

    // Addition / Subtraction
    const parseExpression = (): number => {
      let val = parseMultiplication();
      while (peek() === '+' || peek() === '-') {
        const op = consume();
        const nextVal = parseMultiplication();
        if (op === '+') {
          val += nextVal;
        } else {
          val -= nextVal;
        }
      }
      return val;
    };

    const finalVal = parseExpression();

    // Check if we consumed everything. If there are extra characters, return NaN
    if (index < rawExpr.length) {
      return NaN;
    }

    return finalVal;
  }
}
