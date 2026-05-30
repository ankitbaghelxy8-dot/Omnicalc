/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { HistoryItem, CalculatorMode } from '../types';
import { MathParser } from '../utils/mathParser';
import { Delete, HelpCircle, CornerDownLeft, Info, HelpCircle as HelpIcon, Lock, Sparkles } from 'lucide-react';

interface ScientificCalculatorProps {
  mode: CalculatorMode;
  onModeToggle: () => void;
  onAddHistory: (expression: string, result: string, type: 'calculator' | 'currency') => void;
  restoreExpression?: string | null;
  onClearRestore?: () => void;
  secretPasscode: string;
  onUnlockVault: () => void;
}

export default function ScientificCalculator({
  mode,
  onModeToggle,
  onAddHistory,
  restoreExpression,
  onClearRestore,
  secretPasscode,
  onUnlockVault,
}: ScientificCalculatorProps) {
  const [expression, setExpression] = useState('');
  const [resultDisplay, setResultDisplay] = useState('');
  const [livePreview, setLivePreview] = useState('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Math parser instance
  const parser = useRef(new MathParser(mode));

  // Keep parser state synced with the mode prop
  useEffect(() => {
    parser.current.setMode(mode);
    recalculateLive(expression);
  }, [mode]);

  // Handle incoming restore expression from history
  useEffect(() => {
    if (restoreExpression) {
      setExpression(restoreExpression);
      setErrorStatus(null);
      recalculateLive(restoreExpression);
      if (onClearRestore) onClearRestore();
    }
  }, [restoreExpression]);

  // Real-time evaluation preview selector
  const recalculateLive = (exprStr: string) => {
    if (!exprStr.trim()) {
      setLivePreview('');
      return;
    }

    try {
      // If the formula matches the passcode, show secure unlocked preview
      if (exprStr.trim() === secretPasscode) {
        setLivePreview('🔓 Unlock Vault');
        return;
      }

      // If the formula ends with a standard math sign, don't try to parse it
      if (/[+\-*/÷×(^]$/.test(exprStr)) {
        setLivePreview('');
        return;
      }

      // Detect unbalanced parenthesis to prevent incomplete formula evaluation errors
      const openCount = (exprStr.match(/\(/g) || []).length;
      const closeCount = (exprStr.match(/\)/g) || []).length;
      
      let testExpr = exprStr;
      if (openCount > closeCount) {
        // Auto-close open brackets for preview computation
        testExpr += ')'.repeat(openCount - closeCount);
      }

      const parsedVal = parser.current.evaluate(testExpr);
      if (!isNaN(parsedVal) && isFinite(parsedVal)) {
        // Format live preview
        const formatted = Number(parsedVal.toFixed(8)).toString();
        setLivePreview(formatted);
      } else {
        setLivePreview('');
      }
    } catch {
      setLivePreview('');
    }
  };

  // Main input alteration
  const appendValue = (value: string) => {
    setErrorStatus(null);
    setExpression((prev) => {
      const next = prev + value;
      recalculateLive(next);
      return next;
    });
  };

  const handleClear = () => {
    setExpression('');
    setResultDisplay('');
    setLivePreview('');
    setErrorStatus(null);
  };

  const handleBackspace = () => {
    setErrorStatus(null);
    setExpression((prev) => {
      if (prev.endsWith('sin(') || prev.endsWith('cos(') || prev.endsWith('tan(') || prev.endsWith('log(') || prev.endsWith('abs(')) {
        const next = prev.slice(0, -4);
        recalculateLive(next);
        return next;
      }
      if (prev.endsWith('asin(') || prev.endsWith('acos(') || prev.endsWith('atan(') || prev.endsWith('cbrt(') || prev.endsWith('sqrt(')) {
        const next = prev.slice(0, -5);
        recalculateLive(next);
        return next;
      }
      if (prev.length > 0) {
        const next = prev.slice(0, -1);
        recalculateLive(next);
        return next;
      }
      return prev;
    });
  };

  const handleEvaluate = () => {
    const rawInput = expression.trim();
    if (!rawInput) return;

    // SECRET VAULT TRIGGER CHECK
    if (rawInput === secretPasscode) {
      handleClear();
      onUnlockVault();
      return;
    }

    try {
      // Check parenthesis balance and auto-append missing closures
      const openCount = (expression.match(/\(/g) || []).length;
      const closeCount = (expression.match(/\)/g) || []).length;
      let exprToEvaluate = expression;
      
      if (openCount > closeCount) {
        const matchingBrackets = ')'.repeat(openCount - closeCount);
        exprToEvaluate += matchingBrackets;
        setExpression(exprToEvaluate);
      }

      const calculated = parser.current.evaluate(exprToEvaluate);

      if (isNaN(calculated)) {
        setErrorStatus('Invalid syntax');
        setResultDisplay('');
      } else if (!isFinite(calculated)) {
        setErrorStatus('Division by zero or infinity');
        setResultDisplay('');
      } else {
        // Highly clean formatting
        const formattedResult = Number(calculated.toFixed(10)).toString();
        setResultDisplay(formattedResult);
        setErrorStatus(null);
        
        // Add to history list
        onAddHistory(exprToEvaluate, formattedResult, 'calculator');
        
        // Push result as next baseline
        setLivePreview('');
      }
    } catch (e) {
      setErrorStatus('Math error');
      setResultDisplay('');
    }
  };

  // Keyboard support listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip keyboard binding if focus is in input fields (like the currency search/inputs or vault forms)
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
        return;
      }

      const key = e.key;

      if (/[0-9]/.test(key)) {
        e.preventDefault();
        appendValue(key);
      } else if (key === '.') {
        e.preventDefault();
        appendValue('.');
      } else if (key === '+') {
        e.preventDefault();
        appendValue('+');
      } else if (key === '-') {
        e.preventDefault();
        appendValue('-');
      } else if (key === '*') {
        e.preventDefault();
        appendValue('×');
      } else if (key === '/') {
        e.preventDefault();
        appendValue('÷');
      } else if (key === '(' || key === ')') {
        e.preventDefault();
        appendValue(key);
      } else if (key === '^') {
        e.preventDefault();
        appendValue('^');
      } else if (key === '!') {
        e.preventDefault();
        appendValue('!');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleEvaluate();
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (key === 'Escape' || key === 'c' || key === 'C') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [expression, mode, secretPasscode]);

  const handleContainerClick = () => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="flex flex-col bg-black rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden focus:outline-none focus:ring-1 focus:ring-neutral-700 text-white font-sans max-w-lg mx-auto"
      tabIndex={0}
      id="ios-calculator-container"
    >
      {/* iOS Style Glassmorphic Screen */}
      <div className="bg-black text-white p-6 pb-4 flex flex-col justify-end min-h-[170px] relative select-none">
        
        {/* Camouflage Secure Vault Info bar */}
        <div className="absolute top-4 left-5 right-5 flex justify-between items-center text-neutral-500 font-medium">
          <button
            id="ios-deg-rad-pill"
            onClick={(e) => { e.stopPropagation(); onModeToggle(); }}
            className="text-[10px] font-bold rounded-full bg-neutral-900 border border-neutral-800/80 px-2.5 py-1 text-neutral-300 hover:bg-neutral-850 hover:text-white transition"
          >
            {mode.toUpperCase()}
          </button>
          
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-neutral-400">
            <Lock className="w-3 h-3 text-amber-500" />
            <span>Vault Protected</span>
          </div>
        </div>

        {/* Dynamic Formula Expression Input */}
        <div className="font-sans text-xl text-neutral-400 text-right font-normal tracking-tight break-all cursor-text min-h-[32px] max-h-[64px] overflow-y-auto mb-1 mt-6">
          {expression || '0'}
        </div>

        {/* Interactive Highlight Real-Time / Vault Info Display */}
        {livePreview && !resultDisplay && !errorStatus && (
          <div className={`font-mono text-base font-bold text-right mb-1 ${
            livePreview.includes('Unlock') ? 'text-emerald-400 animate-pulse' : 'text-orange-500'
          }`}>
            = {livePreview}
          </div>
        )}

        {errorStatus && (
          <div className="font-sans text-sm text-rose-500 font-bold text-right mb-1">
            {errorStatus}
          </div>
        )}

        {/* Large Massive iPhone Output display text */}
        <div id="calculator-result-value" className="font-sans text-4xl sm:text-5xl font-semibold tracking-tight text-right text-white select-all break-all h-14 mt-1 leading-none font-bold">
          {resultDisplay ? `= ${resultDisplay}` : ''}
        </div>
      </div>

      {/* iPhone circular keys Layout Grid */}
      <div className="p-6 bg-black flex-1 grid grid-cols-4 sm:grid-cols-5 gap-3.5 border-t border-neutral-900">
        
        {/* SCIENTIFIC EXTRAS - Hide/Show on extreme compact size or display in clean 5th column */}
        {/* Row 1 */}
        <button
          id="ios-clear"
          onClick={handleClear}
          className="aspect-square flex items-center justify-center rounded-full text-base sm:text-lg font-bold bg-neutral-400 text-black hover:bg-neutral-300 transition duration-150 active:scale-95 shadow-lg shadow-black/10 select-none pb-0.5"
        >
          AC
        </button>
        <button
          id="ios-bracket-open"
          onClick={() => appendValue('(')}
          className="aspect-square flex items-center justify-center rounded-full text-base sm:text-lg font-bold bg-neutral-800 text-white hover:bg-neutral-700 transition duration-150 active:scale-95 select-none"
        >
          (
        </button>
        <button
          id="ios-bracket-close"
          onClick={() => appendValue(')')}
          className="aspect-square flex items-center justify-center rounded-full text-base sm:text-lg font-bold bg-neutral-800 text-white hover:bg-neutral-700 transition duration-150 active:scale-95 select-none"
        >
          )
        </button>
        <button
          id="ios-backspace"
          onClick={handleBackspace}
          className="aspect-square flex items-center justify-center rounded-full text-base sm:text-lg font-bold bg-neutral-800 text-white hover:bg-neutral-700 transition duration-150 active:scale-95 select-none"
        >
          <Delete className="w-5 h-5 stroke-[2]" />
        </button>
        {/* Scientific mode column modifier key */}
        <button
          id="ios-sci-sin"
          onClick={() => appendValue('sin(')}
          className="hidden sm:flex aspect-square items-center justify-center rounded-full text-sm font-semibold bg-neutral-900 text-zinc-300 hover:bg-neutral-850 hover:text-white transition duration-150 active:scale-95 select-none"
        >
          sin
        </button>

        {/* Row 2 */}
        <button
          id="ios-7"
          onClick={() => appendValue('7')}
          className="aspect-square flex items-center justify-center rounded-full text-lg sm:text-xl font-bold bg-neutral-850 text-white hover:bg-neutral-750 transition duration-150 active:scale-95 select-none"
        >
          7
        </button>
        <button
          id="ios-8"
          onClick={() => appendValue('8')}
          className="aspect-square flex items-center justify-center rounded-full text-lg sm:text-xl font-bold bg-neutral-850 text-white hover:bg-neutral-750 transition duration-150 active:scale-95 select-none"
        >
          8
        </button>
        <button
          id="ios-9"
          onClick={() => appendValue('9')}
          className="aspect-square flex items-center justify-center rounded-full text-lg sm:text-xl font-bold bg-neutral-850 text-white hover:bg-neutral-750 transition duration-150 active:scale-95 select-none"
        >
          9
        </button>
        <button
          id="ios-divide"
          onClick={() => appendValue('÷')}
          className="aspect-square flex items-center justify-center rounded-full text-xl sm:text-2xl font-bold bg-orange-500 text-white hover:bg-orange-400 hover:text-white transition duration-150 active:scale-95 select-none"
        >
          ÷
        </button>
        <button
          id="ios-sci-cos"
          onClick={() => appendValue('cos(')}
          className="hidden sm:flex aspect-square items-center justify-center rounded-full text-sm font-semibold bg-neutral-900 text-zinc-300 hover:bg-neutral-850 hover:text-white transition duration-150 active:scale-95 select-none"
        >
          cos
        </button>

        {/* Row 3 */}
        <button
          id="ios-4"
          onClick={() => appendValue('4')}
          className="aspect-square flex items-center justify-center rounded-full text-lg sm:text-xl font-bold bg-neutral-850 text-white hover:bg-neutral-750 transition duration-150 active:scale-95 select-none"
        >
          4
        </button>
        <button
          id="ios-5"
          onClick={() => appendValue('5')}
          className="aspect-square flex items-center justify-center rounded-full text-lg sm:text-xl font-bold bg-neutral-850 text-white hover:bg-neutral-750 transition duration-150 active:scale-95 select-none"
        >
          5
        </button>
        <button
          id="ios-6"
          onClick={() => appendValue('6')}
          className="aspect-square flex items-center justify-center rounded-full text-lg sm:text-xl font-bold bg-neutral-850 text-white hover:bg-neutral-750 transition duration-150 active:scale-95 select-none"
        >
          6
        </button>
        <button
          id="ios-times"
          onClick={() => appendValue('×')}
          className="aspect-square flex items-center justify-center rounded-full text-xl sm:text-2xl font-bold bg-orange-500 text-white hover:bg-orange-400 transition duration-150 active:scale-95 select-none"
        >
          ×
        </button>
        <button
          id="ios-sci-tan"
          onClick={() => appendValue('tan(')}
          className="hidden sm:flex aspect-square items-center justify-center rounded-full text-sm font-semibold bg-neutral-900 text-zinc-300 hover:bg-neutral-850 hover:text-white transition duration-150 active:scale-95 select-none"
        >
          tan
        </button>

        {/* Row 4 */}
        <button
          id="ios-1"
          onClick={() => appendValue('1')}
          className="aspect-square flex items-center justify-center rounded-full text-lg sm:text-xl font-bold bg-neutral-850 text-white hover:bg-neutral-750 transition duration-150 active:scale-95 select-none"
        >
          1
        </button>
        <button
          id="ios-2"
          onClick={() => appendValue('2')}
          className="aspect-square flex items-center justify-center rounded-full text-lg sm:text-xl font-bold bg-neutral-850 text-white hover:bg-neutral-750 transition duration-150 active:scale-95 select-none"
        >
          2
        </button>
        <button
          id="ios-3"
          onClick={() => appendValue('3')}
          className="aspect-square flex items-center justify-center rounded-full text-lg sm:text-xl font-bold bg-neutral-850 text-white hover:bg-neutral-750 transition duration-150 active:scale-95 select-none"
        >
          3
        </button>
        <button
          id="ios-minus"
          onClick={() => appendValue('-')}
          className="aspect-square flex items-center justify-center rounded-full text-xl sm:text-2xl font-bold bg-orange-500 text-white hover:bg-orange-400 transition duration-150 active:scale-95 select-none"
        >
          -
        </button>
        <button
          id="ios-sci-sqrt"
          onClick={() => appendValue('sqrt(')}
          className="hidden sm:flex aspect-square items-center justify-center rounded-full text-sm font-semibold bg-neutral-900 text-zinc-300 hover:bg-neutral-850 hover:text-white transition duration-150 active:scale-95 select-none"
        >
          √
        </button>

        {/* Row 5 */}
        <button
          id="ios-0"
          onClick={() => appendValue('0')}
          className="col-span-1 aspect-square flex items-center justify-center rounded-full text-lg sm:text-xl font-bold bg-neutral-850 text-white hover:bg-neutral-750 transition duration-150 active:scale-95 select-none"
          // In standard iOS portrait, 0 spans 2 columns, but in this grids context keeping it consistent looks beautifully styled and clean.
        >
          0
        </button>
        <button
          id="ios-dot"
          onClick={() => appendValue('.')}
          className="aspect-square flex items-center justify-center rounded-full text-lg sm:text-xl font-bold bg-neutral-850 text-white hover:bg-neutral-750 transition duration-150 active:scale-95 select-none"
        >
          .
        </button>
        <button
          id="ios-plus"
          onClick={() => appendValue('+')}
          className="aspect-square flex items-center justify-center rounded-full text-xl sm:text-2xl font-bold bg-orange-500 text-white hover:bg-orange-400 transition duration-150 active:scale-95 select-none"
        >
          +
        </button>
        <button
          id="ios-equal"
          onClick={handleEvaluate}
          className="aspect-square flex items-center justify-center rounded-full text-xl sm:text-2xl font-semibold bg-orange-500 text-white hover:bg-orange-400 transition duration-150 active:scale-95 select-none shadow-md"
        >
          =
        </button>
        <button
          id="ios-sci-power"
          onClick={() => appendValue('^')}
          className="hidden sm:flex aspect-square items-center justify-center rounded-full text-sm font-semibold bg-neutral-900 text-zinc-300 hover:bg-neutral-850 hover:text-white transition duration-150 active:scale-95 select-none"
        >
          x^y
        </button>
      </div>

      {/* Floating Scientific Helpers panel (Quick-access slider below numbers for mobile devices) */}
      <div className="flex sm:hidden overflow-x-auto gap-2 bg-neutral-950 px-4 py-2.5 border-t border-neutral-900 scrollbar-none">
        <button
          onClick={() => appendValue('sin(')}
          className="flex-1 min-w-[50px] px-2.5 py-1 text-xs font-semibold rounded-full bg-neutral-900 text-zinc-300 hover:text-white"
        >
          sin
        </button>
        <button
          onClick={() => appendValue('cos(')}
          className="flex-1 min-w-[50px] px-2.5 py-1 text-xs font-semibold rounded-full bg-neutral-900 text-zinc-300 hover:text-white"
        >
          cos
        </button>
        <button
          onClick={() => appendValue('tan(')}
          className="flex-1 min-w-[50px] px-2.5 py-1 text-xs font-semibold rounded-full bg-neutral-900 text-zinc-300 hover:text-white"
        >
          tan
        </button>
        <button
          onClick={() => appendValue('sqrt(')}
          className="flex-1 min-w-[50px] px-2.5 py-1 text-xs font-semibold rounded-full bg-neutral-900 text-zinc-300 hover:text-white"
        >
          √
        </button>
        <button
          onClick={() => appendValue('^')}
          className="flex-1 min-w-[50px] px-2.5 py-1 text-xs font-semibold rounded-full bg-neutral-900 text-zinc-300 hover:text-white"
        >
          x^y
        </button>
        <button
          onClick={() => appendValue('e')}
          className="flex-1 min-w-[50px] px-2.5 py-1 text-xs font-semibold rounded-full bg-neutral-900 text-zinc-300 hover:text-white"
        >
          e
        </button>
        <button
          onClick={() => appendValue('π')}
          className="flex-1 min-w-[50px] px-2.5 py-1 text-xs font-semibold rounded-full bg-neutral-900 text-zinc-300 hover:text-white"
        >
          π
        </button>
      </div>

      {/* Camouflaged Instructions banner */}
      <div className="bg-neutral-950/80 px-6 py-3 border-t border-neutral-900/50 flex items-center justify-between text-[11px] text-zinc-500 select-none">
        <span className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5" /> Quick Hint:
        </span>
        <span className="font-mono text-[10px] text-zinc-400">
          Entering passcode followed by '=' unlocks secret media vault. Default is <strong className="text-orange-400 font-bold">{secretPasscode}</strong>
        </span>
      </div>
    </div>
  );
}
