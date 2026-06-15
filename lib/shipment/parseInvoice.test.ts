import { parseInvoiceNumber } from './parseInvoice';

const marks = ['GD01', 'GD351', 'D01', 'MM'];

describe('parseInvoiceNumber', () => {
  it('splits container number and shipping mark', () => {
    expect(parseInvoiceNumber('C5GD01', marks)).toEqual({
      containerNumber: 'C5',
      shippingMark: 'GD01',
    });
  });

  it('normalises lowercase input', () => {
    expect(parseInvoiceNumber('c5gd01', marks)).toEqual({
      containerNumber: 'C5',
      shippingMark: 'GD01',
    });
  });

  it('trims surrounding whitespace', () => {
    expect(parseInvoiceNumber('  C5GD01 ', marks)).toEqual({
      containerNumber: 'C5',
      shippingMark: 'GD01',
    });
  });

  it('uses longest match when two marks share a suffix', () => {
    expect(parseInvoiceNumber('C5GD01', marks)).toEqual({
      containerNumber: 'C5',
      shippingMark: 'GD01',
    });
  });

  it('returns null when no shipping mark suffix is found', () => {
    expect(parseInvoiceNumber('C5NOPE', marks)).toBeNull();
  });

  it('returns null when the invoice equals only the mark with no container prefix', () => {
    expect(parseInvoiceNumber('GD01', marks)).toBeNull();
  });

  it('handles marks regardless of case in the marks list', () => {
    expect(parseInvoiceNumber('C5mm', ['gd01', 'mm'])).toEqual({
      containerNumber: 'C5',
      shippingMark: 'MM',
    });
  });
});
