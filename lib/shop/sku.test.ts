import {
  productCode,
  valueCode,
  generateSku,
  uniqueSku,
  assignSkus,
} from './sku';

describe('productCode', () => {
  it('takes first 3 letters of each of the first 3 words', () => {
    expect(productCode('Lucky Godday Tee')).toBe('LUC-GOD-TEE');
  });

  it('caps at three words', () => {
    expect(productCode('Big Red Cotton Hoodie')).toBe('BIG-RED-COT');
  });

  it('strips punctuation and uppercases', () => {
    expect(productCode("O'Neil 2-pack")).toBe('ONE-2PA');
  });

  it('falls back to SKU when the name has no alphanumerics', () => {
    expect(productCode('—')).toBe('SKU');
  });
});

describe('valueCode', () => {
  it('maps common sizes to canonical codes', () => {
    expect(valueCode('Small')).toBe('S');
    expect(valueCode('medium')).toBe('M');
    expect(valueCode('Large')).toBe('L');
    expect(valueCode('X-Large')).toBe('XL');
    expect(valueCode('XXL')).toBe('XXL');
  });

  it('uses first 3 alphanumerics for non-sizes', () => {
    expect(valueCode('Red')).toBe('RED');
    expect(valueCode('Blue')).toBe('BLU');
    expect(valueCode('500ml')).toBe('500');
  });

  it('falls back to V for empty-ish values', () => {
    expect(valueCode('—')).toBe('V');
  });
});

describe('generateSku', () => {
  it('joins product code with each option value code', () => {
    expect(generateSku('Lucky Godday Tee', ['Medium', 'Red'])).toBe(
      'LUC-GOD-TEE-M-RED'
    );
  });

  it('returns just the product code for a default variant', () => {
    expect(generateSku('Lucky Godday Tee', [])).toBe('LUC-GOD-TEE');
  });

  it('handles a single option', () => {
    expect(generateSku('Lucky Godday Tee', ['Large'])).toBe('LUC-GOD-TEE-L');
  });
});

describe('uniqueSku', () => {
  it('returns the base when free', () => {
    const taken = new Set<string>();
    expect(uniqueSku('TEE-RED', taken)).toBe('TEE-RED');
    expect(taken.has('TEE-RED')).toBe(true);
  });

  it('appends an incrementing suffix on collision', () => {
    const taken = new Set(['TEE-RED']);
    expect(uniqueSku('TEE-RED', taken)).toBe('TEE-RED-2');
    expect(uniqueSku('TEE-RED', taken)).toBe('TEE-RED-3');
  });
});

describe('assignSkus', () => {
  it('generates fresh SKUs for new variants', () => {
    expect(
      assignSkus('Lucky Godday Tee', [
        { optionValues: ['Small'] },
        { optionValues: ['Medium'] },
      ])
    ).toEqual(['LUC-GOD-TEE-S', 'LUC-GOD-TEE-M']);
  });

  it('preserves existing SKUs and routes new ones around them', () => {
    const result = assignSkus('Lucky Godday Tee', [
      { optionValues: ['Small'], existingSku: 'OLD-SKU-1' },
      { optionValues: ['Medium'] },
    ]);
    expect(result).toEqual(['OLD-SKU-1', 'LUC-GOD-TEE-M']);
  });

  it('de-duplicates values that abbreviate to the same code', () => {
    // "Reddish" and "Red" both abbreviate to RED.
    expect(
      assignSkus('Tee', [
        { optionValues: ['Red'] },
        { optionValues: ['Reddish'] },
      ])
    ).toEqual(['TEE-RED', 'TEE-RED-2']);
  });

  it('avoids SKUs already taken by other products', () => {
    const taken = new Set(['LUC-GOD-TEE-S']);
    expect(
      assignSkus('Lucky Godday Tee', [{ optionValues: ['Small'] }], taken)
    ).toEqual(['LUC-GOD-TEE-S-2']);
  });
});
