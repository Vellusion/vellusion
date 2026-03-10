/**
 * Key-value map of shader preprocessor defines.
 *
 * - `boolean` values control `// #if` conditionals (truthy / falsy).
 * - `string` and `number` values are injected as WGSL `const` declarations
 *   **and** also participate in conditionals (non-empty string / non-zero = truthy).
 */
export interface ShaderDefines {
  [key: string]: string | number | boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INCLUDE_RE = /^(\s*)\/\/\s*#include\s+"([^"]+)"\s*$/;
const IF_RE = /^\s*\/\/\s*#if\s+(\w+)\s*$/;
const ELSE_RE = /^\s*\/\/\s*#else\s*$/;
const ENDIF_RE = /^\s*\/\/\s*#endif\s*$/;

function isTruthy(value: string | number | boolean | undefined): boolean {
  if (value === undefined) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  // string — non-empty is truthy
  return value.length > 0;
}

/**
 * Resolve `// #include "filename"` directives by looking up the includes map.
 * Throws if a referenced include is not found.
 */
function resolveIncludes(
  source: string,
  includes: Record<string, string>,
): string {
  const lines = source.split('\n');
  const out: string[] = [];

  for (const line of lines) {
    const match = INCLUDE_RE.exec(line);
    if (match) {
      const filename = match[2];
      if (!(filename in includes)) {
        throw new Error(`ShaderPreprocessor: missing include "${filename}"`);
      }
      out.push(includes[filename]);
    } else {
      out.push(line);
    }
  }

  return out.join('\n');
}

/**
 * Build `const` declarations for non-boolean defines and prepend them
 * to the source.
 */
function injectDefines(source: string, defines: ShaderDefines): string {
  const declarations: string[] = [];

  for (const [key, value] of Object.entries(defines)) {
    if (typeof value === 'boolean') continue; // booleans only affect conditionals
    if (typeof value === 'number') {
      // Emit as f32 if the value has a fractional part, otherwise i32-style.
      declarations.push(`const ${key} = ${value};`);
    } else {
      // string value — emit verbatim (e.g. "vec3f(1.0, 0.0, 0.0)")
      declarations.push(`const ${key} = ${value};`);
    }
  }

  if (declarations.length === 0) return source;
  return declarations.join('\n') + '\n' + source;
}

/**
 * Process `// #if DEFINE` / `// #else` / `// #endif` conditional blocks.
 * Supports arbitrary nesting.
 */
function resolveConditionals(source: string, defines: ShaderDefines): string {
  const lines = source.split('\n');
  const out: string[] = [];

  // Stack tracks whether the current nesting level is "active" (emitting lines).
  // Each entry: { active: boolean, parentActive: boolean, elseAllowed: boolean }
  const stack: { active: boolean; parentActive: boolean; elseAllowed: boolean }[] = [];

  function isActive(): boolean {
    return stack.length === 0 || stack[stack.length - 1].active;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // --- #if ---
    const ifMatch = IF_RE.exec(line);
    if (ifMatch) {
      const defineName = ifMatch[1];
      const parentActive = isActive();
      const conditionTrue = isTruthy(defines[defineName]);
      stack.push({
        active: parentActive && conditionTrue,
        parentActive,
        elseAllowed: true,
      });
      continue;
    }

    // --- #else ---
    if (ELSE_RE.test(line)) {
      if (stack.length === 0) {
        throw new Error(`ShaderPreprocessor: // #else without matching // #if at line ${i + 1}`);
      }
      const top = stack[stack.length - 1];
      if (!top.elseAllowed) {
        throw new Error(`ShaderPreprocessor: duplicate // #else at line ${i + 1}`);
      }
      // Flip active state — but only if parent is active.
      top.active = top.parentActive && !top.active;
      top.elseAllowed = false;
      continue;
    }

    // --- #endif ---
    if (ENDIF_RE.test(line)) {
      if (stack.length === 0) {
        throw new Error(`ShaderPreprocessor: // #endif without matching // #if at line ${i + 1}`);
      }
      stack.pop();
      continue;
    }

    // Regular line — emit only when active.
    if (isActive()) {
      out.push(line);
    }
  }

  if (stack.length !== 0) {
    throw new Error('ShaderPreprocessor: unterminated // #if block');
  }

  return out.join('\n');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Pure-text shader preprocessor.
 *
 * Processing order: **includes -> defines -> conditionals**.
 */
export const ShaderPreprocessor = {
  /**
   * Process a shader source string with optional defines.
   *
   * 1. Inject `const` declarations for numeric / string defines.
   * 2. Resolve `// #if` / `// #else` / `// #endif` conditionals.
   */
  process(source: string, defines?: ShaderDefines): string {
    if (!defines || Object.keys(defines).length === 0) {
      return source;
    }
    const withDefines = injectDefines(source, defines);
    return resolveConditionals(withDefines, defines);
  },

  /**
   * Process a shader source string with both includes and defines.
   *
   * Processing order: includes first, then defines, then conditionals.
   */
  processWithIncludes(
    source: string,
    includes: Record<string, string>,
    defines?: ShaderDefines,
  ): string {
    const withIncludes = resolveIncludes(source, includes);
    return ShaderPreprocessor.process(withIncludes, defines);
  },
} as const;
