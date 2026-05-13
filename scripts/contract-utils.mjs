import fs from 'node:fs';

export function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

export function getProtoFields(protoContent, messageName) {
  const match = protoContent.match(new RegExp(`message\\s+${messageName}\\s*\\{([\\s\\S]*?)\\n\\}`, 'm'));
  if (!match) throw new Error(`Message ${messageName} not found in proto.`);

  return match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('//'))
    .map((line) => line.match(/(?:repeated\s+)?(?:map<[^>]+>|[\w.]+)\s+(\w+)\s*=\s*\d+;/)?.[1])
    .filter(Boolean);
}

function extractObjectLiteral(source, startIndex) {
  const openIndex = source.indexOf('{', startIndex);
  if (openIndex === -1) throw new Error('No opening brace found while parsing schema.');
  let depth = 0;
  for (let i = openIndex; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(openIndex + 1, i);
    }
  }
  throw new Error('Unclosed object literal while parsing schema.');
}

export function getSchemaKeys(contractsSource, schemaName) {
  // Match both single-line `= z.object({...})` and multi-line chained
  // `= z\n  .object({...}).strict()`. The schemas in
  // core/contracts/critical-contracts.ts currently use the chained
  // form, but either should be acceptable. `\s*` covers whitespace
  // including newlines.
  const declaration = new RegExp(
    `export const ${schemaName}\\s*=\\s*z\\s*\\.\\s*object\\s*\\(`,
    'm',
  );
  const match = declaration.exec(contractsSource);
  if (!match) throw new Error(`Schema ${schemaName} not found.`);
  const markerEnd = match.index + match[0].length;

  const body = extractObjectLiteral(contractsSource, markerEnd);
  const keys = [];
  let depthParen = 0;
  let depthBrace = 0;
  let token = '';

  for (let i = 0; i < body.length; i += 1) {
    const c = body[i];
    if (c === '(') depthParen += 1;
    if (c === ')') depthParen -= 1;
    if (c === '{') depthBrace += 1;
    if (c === '}') depthBrace -= 1;

    if (depthParen === 0 && depthBrace === 0 && c === ':') {
      const key = token.trim().split('\n').pop().trim();
      if (key) keys.push(key.replace(/['"]/g, ''));
      token = '';
      continue;
    }

    if (depthParen === 0 && depthBrace === 0 && c === ',') {
      token = '';
      continue;
    }

    token += c;
  }

  return [...new Set(keys.filter((k) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(k)))];
}

export function assertExactSet(label, actual, expected, diffs) {
  const a = [...actual].sort();
  const e = [...expected].sort();
  if (a.join('|') !== e.join('|')) {
    diffs.push(`${label}: got [${a.join(', ')}], expected [${e.join(', ')}]`);
  }
}
