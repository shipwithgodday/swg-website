import { parseShippingMark } from './marks';

describe('parseShippingMark', () => {
  it('parses a standard GD mark', () => {
    expect(parseShippingMark('GD351')).toEqual({
      mark: 'GD351',
      markNo: 351,
    });
  });
  it('trims surrounding whitespace', () => {
    expect(parseShippingMark('GD350 ')).toEqual({
      mark: 'GD350',
      markNo: 350,
    });
  });
  it('keeps a non-standard mark with markNo 0', () => {
    expect(parseShippingMark('GD/MM')).toEqual({
      mark: 'GD/MM',
      markNo: 0,
    });
  });
  it('returns null for an empty mark', () => {
    expect(parseShippingMark('   ')).toBeNull();
  });
});
