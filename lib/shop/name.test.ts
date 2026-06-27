import { splitFullName } from './name';

describe('splitFullName', () => {
  it('splits first and last on the first space', () => {
    expect(splitFullName('Ada Lovelace')).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
  });
  it('puts a multi-word remainder in lastName', () => {
    expect(splitFullName('Kwame Nkrumah Jr')).toEqual({
      firstName: 'Kwame',
      lastName: 'Nkrumah Jr',
    });
  });
  it('leaves lastName empty for a single name', () => {
    expect(splitFullName('Cher')).toEqual({ firstName: 'Cher', lastName: '' });
  });
  it('trims surrounding and collapses inner whitespace', () => {
    expect(splitFullName('  Ada   Lovelace  ')).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
  });
});
