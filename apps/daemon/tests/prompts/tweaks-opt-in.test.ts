import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderOfficialDesignerPrompt } from '../../src/prompts/official-system.js';

// The official prompt used to tell every prototype to ship a floating Tweaks
// panel, while discovery's "Slides + prototypes" rule (added in #1224) says
// product prototypes must not carry designer controls. Both reached the same
// run, so the model got opposite orders. It also paired "Don't surprise-add
// content" with a "Surprise the user ... more ambitious than what was asked
// for" section. The contracts copy is the API/BYOK path, so both copies are
// checked here.

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

const PROMPTS: ReadonlyArray<readonly [string, string]> = [
  ['daemon classic', renderOfficialDesignerPrompt('filesystem')],
  ['contracts (API/BYOK)', read('../../../../packages/contracts/src/prompts/official-system.ts')],
];

const DISCOVERY: ReadonlyArray<readonly [string, string]> = [
  ['daemon discovery', read('../../src/prompts/discovery.ts')],
  ['contracts discovery', read('../../../../packages/contracts/src/prompts/discovery.ts')],
];

describe('Tweaks panel is opt-in, matching the product-prototype rule', () => {
  it('no official prompt orders a Tweaks panel on every prototype', () => {
    for (const [label, prompt] of PROMPTS) {
      expect(prompt, label).not.toContain('For prototypes, add a small floating "Tweaks" panel');
      expect(prompt, label).toContain('panel only when the user asks for one');
    }
  });

  it('the discovery rule the official prompt defers to still exists', () => {
    for (const [label, source] of DISCOVERY) {
      expect(source, label).toContain('do **not** include floating Tweaks panels');
    }
  });
});

describe('ambition is about execution, not added content', () => {
  it('drops the "Surprise the user" order that contradicted "Don\'t surprise-add content"', () => {
    for (const [label, prompt] of PROMPTS) {
      expect(prompt, label).not.toContain('## Surprise the user');
      expect(prompt, label).toContain("Don't surprise-add content the user didn't ask for.");
      expect(prompt, label).toContain('Ambition goes into execution');
    }
  });
});
