'use strict';
const fs = require('node:fs');

function extractArray(source, marker) {
  const at = source.indexOf('const ' + marker + '=');
  if (at < 0) throw new Error('Missing array: ' + marker);
  const open = source.indexOf('[', at);
  let depth = 0, quote = '', escaped = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"') { quote = ch; continue; }
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) return JSON.parse(source.slice(open, i + 1));
    }
  }
  throw new Error('Unclosed array: ' + marker);
}

const errors = [];
const cases = [
  { name: 'Math I/A', file: 'practice.html', questions: 'COMMON_TEST', stimuli: 'COMMON_STIMULI', expectedQuestions: 23, expectedGroups: 4, minGroup: 5, maxGroup: 6 },
  { name: 'Math II/B/C', file: 'practice.html', questions: 'COMMON_TEST_2BC', stimuli: 'COMMON_STIMULI_2BC', expectedQuestions: 31, expectedGroups: 7, minGroup: 4, maxGroup: 5 },
];
const source = fs.readFileSync('practice.html', 'utf8');
for (const spec of cases) {
  let questions, stimuli;
  try {
    questions = extractArray(source, spec.questions);
    stimuli = extractArray(source, spec.stimuli);
  } catch (e) { errors.push(spec.name + ': ' + e.message); continue; }
  if (questions.length !== spec.expectedQuestions) errors.push(spec.name + ': expected ' + spec.expectedQuestions + ' questions, found ' + questions.length);
  if (stimuli.length !== spec.expectedGroups) errors.push(spec.name + ': expected ' + spec.expectedGroups + ' stimuli, found ' + stimuli.length);
  const seen = new Set(), sizes = new Map(), prompts = new Set();
  let previousIndex = null;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i], label = spec.name + ' question ' + (i + 1);
    if (!Array.isArray(q) || q.length !== 5) { errors.push(label + ': expected [question, options, answer, explanation, stimulusIndex]'); continue; }
    if (typeof q[0] !== 'string' || !q[0].trim()) errors.push(label + ': empty prompt');
    if (!Array.isArray(q[1]) || q[1].length !== 4 || q[1].some(x => typeof x !== 'string' || !x.trim())) errors.push(label + ': expected four non-empty options');
    if (!Number.isInteger(q[2]) || q[2] < 0 || q[2] > 3) errors.push(label + ': invalid answer index');
    if (typeof q[3] !== 'string' || !q[3].trim()) errors.push(label + ': missing explanation');
    if (!Number.isInteger(q[4]) || q[4] < 0 || q[4] >= stimuli.length) errors.push(label + ': invalid stimulus index');
    const match = String(q[0] || '').match(/【大問(\d+)/);
    if (match && Number(match[1]) !== q[4] + 1) errors.push(label + ': large-question label does not match stimulus index');
    if (q[4] !== previousIndex) {
      if (seen.has(q[4])) errors.push(label + ': questions using one stimulus are split into separate groups');
      seen.add(q[4]);
      previousIndex = q[4];
    }
    sizes.set(q[4], (sizes.get(q[4]) || 0) + 1);
    const normalized = String(q[0] || '').normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, '');
    if (prompts.has(normalized)) errors.push(label + ': duplicate prompt');
    prompts.add(normalized);
  }
  for (let i = 0; i < stimuli.length; i++) {
    if (!sizes.has(i)) errors.push(spec.name + ': stimulus ' + (i + 1) + ' has no questions');
    const count = sizes.get(i) || 0;
    if (count < spec.minGroup || count > spec.maxGroup) errors.push(spec.name + ': stimulus ' + (i + 1) + ' has ' + count + ' questions outside the expected range');
  }
  console.log(spec.name + ': ' + questions.length + ' questions across ' + stimuli.length + ' connected large questions');
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('Common-test mathematics structure checks passed.');
