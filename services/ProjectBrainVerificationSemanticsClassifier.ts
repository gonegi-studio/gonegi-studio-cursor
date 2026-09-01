import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

export interface VerificationSemanticsCoverage {
  direct_services: string[];
  asserted_helper_services: string[];
  evidence_scripts: string[];
}

function parseSource(filename: string, text: string): ts.SourceFile {
  return ts.createSourceFile(filename, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
}

function servicePathFromSpecifier(specifier: string): string | null {
  const scriptMatch = specifier.match(/^\.\.\/services\/([A-Za-z0-9_]+)\.js$/);
  if (scriptMatch) return `services/${scriptMatch[1]}.ts`;
  const serviceMatch = specifier.match(/^\.\/([A-Za-z0-9_]+)\.js$/);
  if (serviceMatch) return `services/${serviceMatch[1]}.ts`;
  return null;
}

function collectValueServiceImports(source: ts.SourceFile): Map<string, string> {
  const imports = new Map<string, string>();
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const servicePath = servicePathFromSpecifier(statement.moduleSpecifier.text);
    const clause = statement.importClause;
    if (!servicePath || !clause || clause.isTypeOnly) continue;
    if (clause.name) imports.set(clause.name.text, servicePath);
    const bindings = clause.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) {
        if (!element.isTypeOnly) imports.set(element.name.text, servicePath);
      }
    }
  }
  return imports;
}

function unwrapExpression(expression: ts.Expression): ts.Expression {
  let current = expression;
  while (
    ts.isAwaitExpression(current) ||
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function calledIdentifier(expression: ts.Expression): string | null {
  const unwrapped = unwrapExpression(expression);
  if (!ts.isCallExpression(unwrapped)) return null;
  const callee = unwrapExpression(unwrapped.expression);
  return ts.isIdentifier(callee) ? callee.text : null;
}

function isZero(expression: ts.Expression): boolean {
  return ts.isNumericLiteral(expression) && expression.text === '0';
}

function isOne(expression: ts.Expression): boolean {
  return ts.isNumericLiteral(expression) && expression.text === '1';
}

function assertedResultVariable(exitArgument: ts.Expression): string | null {
  const unwrapped = unwrapExpression(exitArgument);
  if (!ts.isConditionalExpression(unwrapped) || !isZero(unwrapped.whenTrue) || !isOne(unwrapped.whenFalse)) return null;
  const condition = unwrapExpression(unwrapped.condition);
  if (!ts.isPropertyAccessExpression(condition) || condition.name.text !== 'passed') return null;
  return ts.isIdentifier(condition.expression) ? condition.expression.text : null;
}

/**
 * Finds services covered by an actual CLI assertion contract. Filenames are
 * deliberately irrelevant: the script must call an imported service value,
 * store its result, and exit 0/1 from that same result's `passed` property.
 */
export function classifyAssertAndExitScript(filename: string, text: string): string[] {
  const source = parseSource(filename, text);
  const serviceImports = collectValueServiceImports(source);
  const resultService = new Map<string, string>();

  const visitAssignments = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const called = calledIdentifier(node.initializer);
      const service = called ? serviceImports.get(called) : null;
      if (service) resultService.set(node.name.text, service);
    }
    ts.forEachChild(node, visitAssignments);
  };
  visitAssignments(source);

  const covered = new Set<string>();
  const visitExits = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'process' &&
      node.expression.name.text === 'exit' &&
      node.arguments.length === 1
    ) {
      const resultVariable = assertedResultVariable(node.arguments[0]);
      const service = resultVariable ? resultService.get(resultVariable) : null;
      if (service) covered.add(service);
    }
    ts.forEachChild(node, visitExits);
  };
  visitExits(source);
  return [...covered].sort();
}

function identifiersIn(node: ts.Node): Set<string> {
  const identifiers = new Set<string>();
  const visit = (child: ts.Node): void => {
    if (ts.isIdentifier(child)) identifiers.add(child.text);
    ts.forEachChild(child, visit);
  };
  visit(node);
  return identifiers;
}

/**
 * One deliberately narrow transitive rule for shared verification helpers:
 * a helper is covered only when an imported `verify*` function is called and
 * its assigned value has a variable-dependency path to a returned `passed`
 * property. Merely importing or calling a helper is insufficient.
 */
export function classifyAssertedHelperServices(filename: string, text: string): string[] {
  const source = parseSource(filename, text);
  const serviceImports = collectValueServiceImports(source);
  const dependencies = new Map<string, Set<string>>();
  const verifierSources = new Map<string, Set<string>>();
  const returnedPassedVariables = new Set<string>();

  const visit = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const variable = node.name.text;
      dependencies.set(variable, identifiersIn(node.initializer));
      const sources = new Set<string>();
      const findVerifierCalls = (child: ts.Node): void => {
        if (ts.isCallExpression(child) && ts.isIdentifier(child.expression) && child.expression.text.startsWith('verify')) {
          const service = serviceImports.get(child.expression.text);
          if (service) sources.add(service);
        }
        ts.forEachChild(child, findVerifierCalls);
      };
      findVerifierCalls(node.initializer);
      if (sources.size > 0) verifierSources.set(variable, sources);
    }

    if (ts.isReturnStatement(node) && node.expression && ts.isObjectLiteralExpression(node.expression)) {
      for (const property of node.expression.properties) {
        if (ts.isShorthandPropertyAssignment(property) && property.name.text === 'passed') {
          returnedPassedVariables.add('passed');
        } else if (
          ts.isPropertyAssignment(property) &&
          ((ts.isIdentifier(property.name) && property.name.text === 'passed') ||
            (ts.isStringLiteral(property.name) && property.name.text === 'passed')) &&
          ts.isIdentifier(property.initializer)
        ) {
          returnedPassedVariables.add(property.initializer.text);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  const reachable = new Set<string>();
  const stack = [...returnedPassedVariables];
  while (stack.length > 0) {
    const variable = stack.pop()!;
    if (reachable.has(variable)) continue;
    reachable.add(variable);
    for (const dependency of dependencies.get(variable) ?? []) {
      if (dependencies.has(dependency)) stack.push(dependency);
    }
  }

  const helpers = new Set<string>();
  for (const variable of reachable) {
    for (const service of verifierSources.get(variable) ?? []) helpers.add(service);
  }
  return [...helpers].sort();
}

export function discoverVerificationSemanticsCoverage(root: string): VerificationSemanticsCoverage {
  const scriptsDir = path.join(root, 'scripts');
  const directServices = new Set<string>();
  const evidenceScripts = new Set<string>();

  for (const filename of fs.readdirSync(scriptsDir).filter((name) => name.endsWith('.ts')).sort()) {
    const relpath = `scripts/${filename}`;
    const text = fs.readFileSync(path.join(scriptsDir, filename), 'utf8');
    // Cheap prefilter before parsing thousands of scripts.
    if (!text.includes('process.exit') || !text.includes('.passed')) continue;
    const covered = classifyAssertAndExitScript(relpath, text);
    if (covered.length === 0) continue;
    evidenceScripts.add(relpath);
    for (const service of covered) directServices.add(service);
  }

  const assertedHelpers = new Set<string>();
  for (const service of directServices) {
    const abs = path.join(root, service);
    if (!fs.existsSync(abs)) continue;
    const text = fs.readFileSync(abs, 'utf8');
    for (const helper of classifyAssertedHelperServices(service, text)) assertedHelpers.add(helper);
  }

  return {
    direct_services: [...directServices].sort(),
    asserted_helper_services: [...assertedHelpers].sort(),
    evidence_scripts: [...evidenceScripts].sort(),
  };
}

export function runVerificationSemanticsClassifierSelfTest(): { ok: boolean; detail: string } {
  const positive = [
    "import { execute } from '../services/SelfTestEngine.js';",
    'const result = await execute();',
    'process.exit(result.passed ? 0 : 1);',
  ].join('\n');
  const nameOnly = [
    "import { execute } from '../services/SelfTestEngine.js';",
    'const result = await execute();',
    'process.exit(0);',
  ].join('\n');
  const unrelatedResult = [
    "import { execute } from '../services/SelfTestEngine.js';",
    'const result = await execute();',
    'const other = { passed: true };',
    'process.exit(other.passed ? 0 : 1);',
  ].join('\n');
  const helperPositive = [
    "import { verifyInvariant } from './SelfTestCore.js';",
    'export function execute() {',
    '  const invariantOk = verifyInvariant();',
    '  const ready = invariantOk && true;',
    '  const passed = ready;',
    '  return { passed };',
    '}',
  ].join('\n');
  const helperUnused = [
    "import { verifyInvariant } from './SelfTestCore.js';",
    'export function execute() {',
    '  const unused = verifyInvariant();',
    '  const passed = true;',
    '  return { passed };',
    '}',
  ].join('\n');

  const direct = classifyAssertAndExitScript('scripts/arbitrary-name.ts', positive);
  const helper = classifyAssertedHelperServices('services/SelfTestEngine.ts', helperPositive);
  const ok =
    direct.length === 1 &&
    direct[0] === 'services/SelfTestEngine.ts' &&
    classifyAssertAndExitScript('scripts/verify-name-only.ts', nameOnly).length === 0 &&
    classifyAssertAndExitScript('scripts/run-name-only.ts', unrelatedResult).length === 0 &&
    helper.length === 1 &&
    helper[0] === 'services/SelfTestCore.ts' &&
    classifyAssertedHelperServices('services/SelfTestEngine.ts', helperUnused).length === 0;

  return {
    ok,
    detail: ok
      ? 'assert-and-exit dataflow recognized independent of filename; name-only, fixed-success, unrelated-result, and unused-helper cases rejected'
      : `FAILED — direct=${JSON.stringify(direct)}, helper=${JSON.stringify(helper)}`,
  };
}
