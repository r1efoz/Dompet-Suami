import assert from 'node:assert/strict';
import { formatCompact, formatSignedCompact } from './format';

assert.equal(formatCompact(18214145), '18,21 jt');
assert.equal(formatCompact(8500000), '8,50 jt');
assert.equal(formatCompact(999600), '1,00 jt');
assert.equal(formatCompact(458504), '459 rb');
assert.equal(formatCompact(1000), '1 rb');
assert.equal(formatCompact(900), '900');
assert.equal(formatCompact(0), '0');
assert.equal(formatCompact(-458504), '459 rb');
assert.equal(formatSignedCompact(12282654, 'expense'), '−12,28 jt');
console.log('format self-check: 9 assertions passed');
