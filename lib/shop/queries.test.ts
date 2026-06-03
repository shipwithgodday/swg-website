import { padPopular } from './queries';

const p = (slug: string) => ({ slug });

describe('padPopular', () => {
  it('returns an empty list when nothing ranked (section hidden)', () => {
    expect(padPopular([], [p('a'), p('b')], 5)).toEqual([]);
  });

  it('returns ranked items untouched when already at the limit', () => {
    const ranked = [p('a'), p('b'), p('c'), p('d'), p('e')];
    expect(padPopular(ranked, [p('x')], 5)).toEqual(ranked);
  });

  it('truncates when more than the limit ranked', () => {
    const ranked = [p('a'), p('b'), p('c')];
    expect(padPopular(ranked, [], 2)).toEqual([p('a'), p('b')]);
  });

  it('pads with fillers, skipping ones already ranked', () => {
    const ranked = [p('a'), p('b')];
    const fillers = [p('b'), p('c'), p('d')];
    expect(padPopular(ranked, fillers, 4)).toEqual([
      p('a'),
      p('b'),
      p('c'),
      p('d'),
    ]);
  });

  it('returns what it has when fillers run out before the limit', () => {
    expect(padPopular([p('a')], [p('b')], 5)).toEqual([p('a'), p('b')]);
  });

  it('preserves ranked order ahead of fillers', () => {
    expect(padPopular([p('z')], [p('a'), p('b')], 3)).toEqual([
      p('z'),
      p('a'),
      p('b'),
    ]);
  });
});
