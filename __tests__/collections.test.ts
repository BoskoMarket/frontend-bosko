import { readCollection } from '@/core/api/collections';
test('normaliza listas y páginas, pero no oculta un contrato roto como lista vacía', () => {
  expect(readCollection([{ id: '1' }])).toEqual([{ id: '1' }]);
  expect(readCollection({ data: [{ id: '2' }], total: 1 })).toEqual([{ id: '2' }]);
  expect(() => readCollection({ items: [] })).toThrow('formato inesperado');
  expect(() => readCollection(null)).toThrow();
});
