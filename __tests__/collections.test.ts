import { flattenUniqueById, readCollection } from '@/core/api/collections';
test('normaliza listas y páginas, pero no oculta un contrato roto como lista vacía', () => {
  expect(readCollection([{ id: '1' }])).toEqual([{ id: '1' }]);
  expect(readCollection({ data: [{ id: '2' }], total: 1 })).toEqual([{ id: '2' }]);
  expect(() => readCollection({ items: [] })).toThrow('formato inesperado');
  expect(() => readCollection(null)).toThrow();
});

test('flattenUniqueById keeps the first occurrence across pages', () => {
  const pages = [
    { data: [{ id: 'a', v: 1 }, { id: 'b', v: 1 }] },
    { data: [{ id: 'b', v: 2 }, { id: 'c', v: 2 }] },
  ];
  expect(flattenUniqueById(pages)).toEqual([{ id: 'a', v: 1 }, { id: 'b', v: 1 }, { id: 'c', v: 2 }]);
  expect(flattenUniqueById([])).toEqual([]);
});
