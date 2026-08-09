import zombieAnimationData from '../models/zombie_animation.json';

export interface MolangVariables {
  'query.life_time': number;
  'variable.attack_time': number;
  'variable.swim_amount': number;
  'variable.is_brandishing_spear': number;
  'query.target_x_rotation': number;
  'query.is_baby': number;
  'this': number;
}

/**
 * Helper to replace functions with balanced parentheses in Molang code
 */
function replaceBalancedFunc(
  code: string,
  funcName: string,
  replacer: (argContent: string) => string
): string {
  let idx = 0;
  while ((idx = code.indexOf(funcName + '(', idx)) !== -1) {
    const start = idx + funcName.length + 1;
    let depth = 1;
    let end = start;
    while (end < code.length && depth > 0) {
      if (code[end] === '(') depth++;
      else if (code[end] === ')') depth--;
      if (depth > 0) end++;
    }
    if (depth === 0) {
      const arg = code.substring(start, end);
      const replacement = replacer(arg);
      code = code.substring(0, idx) + replacement + code.substring(end + 1);
      idx += replacement.length;
    } else {
      break;
    }
  }
  return code;
}

/**
 * Helper to replace math.lerp(a, b, t) with balanced parenthesis handling
 */
function replaceLerp(code: string): string {
  let idx = 0;
  const funcName = 'math.lerp';
  while ((idx = code.indexOf(funcName + '(', idx)) !== -1) {
    const start = idx + funcName.length + 1;
    let depth = 1;
    let end = start;
    while (end < code.length && depth > 0) {
      if (code[end] === '(') depth++;
      else if (code[end] === ')') depth--;
      if (depth > 0) end++;
    }
    if (depth === 0) {
      const fullArg = code.substring(start, end);
      const args: string[] = [];
      let current = '';
      let argDepth = 0;
      for (let i = 0; i < fullArg.length; i++) {
        const char = fullArg[i];
        if (char === '(') argDepth++;
        else if (char === ')') argDepth--;
        if (char === ',' && argDepth === 0) {
          args.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      args.push(current);

      if (args.length === 3) {
        const replacement = `((${args[0]}) + ((${args[1]}) - (${args[0]})) * (${args[2]}))`;
        code = code.substring(0, idx) + replacement + code.substring(end + 1);
        idx += replacement.length;
      } else {
        idx = end + 1;
      }
    } else {
      break;
    }
  }
  return code;
}

/**
 * Evaluates Bedrock Molang mathematical expressions safely
 */
export function evaluateMolang(
  expr: string | number | undefined,
  vars: MolangVariables
): number {
  if (expr === undefined || expr === null) return 0;
  if (typeof expr === 'number') return expr;

  try {
    let code = String(expr).toLowerCase();

    // 1. Replace Molang math functions with degree-to-radian conversion where needed
    code = replaceBalancedFunc(code, 'math.sin', (arg) => `Math.sin((${arg}) * (Math.PI / 180))`);
    code = replaceBalancedFunc(code, 'math.cos', (arg) => `Math.cos((${arg}) * (Math.PI / 180))`);
    code = replaceBalancedFunc(code, 'math.sqrt', (arg) => `Math.sqrt(${arg})`);
    code = replaceBalancedFunc(code, 'math.abs', (arg) => `Math.abs(${arg})`);
    code = replaceLerp(code);

    // 2. Replace Molang variables with numeric values
    Object.entries(vars).forEach(([key, val]) => {
      const safeKey = key.toLowerCase().replace(/\./g, '\\.');
      const regex = new RegExp(`\\b${safeKey}\\b`, 'g');
      code = code.replace(regex, String(val));
    });

    // 3. Constant replacements
    code = code.replace(/\bmath\.pi\b/g, String(Math.PI));

    // Fix ternary operators if present: e.g. cond ? val1 : val2
    if (code.includes('?')) {
      // Wrap ternary condition and branches in parens to prevent precedence bugs
      code = code.replace(/([^?:]+)\?([^:]+):([^;]+)/g, '(($1) ? ($2) : ($3))');
    }

    // 4. Evaluate safely
    // eslint-disable-next-line no-new-func
    const result = new Function(`return (${code});`)();
    return typeof result === 'number' && !isNaN(result) ? result : 0;
  } catch (e) {
    return 0;
  }
}

export const ZOMBIE_BEDROCK_ANIMATIONS = zombieAnimationData.animations;
