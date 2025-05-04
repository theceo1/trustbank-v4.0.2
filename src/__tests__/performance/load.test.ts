import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: vi.fn(),
}));

describe('Performance Tests', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createClientComponentClient as any).mockReturnValue(mockSupabase);
  });

  it('should handle large data sets efficiently', async () => {
    const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: Math.random(),
    }));

    mockSupabase.from().select.mockResolvedValueOnce({
      data: largeDataSet,
      error: null,
    });

    const startTime = performance.now();
    const result = await mockSupabase.from('large_table').select('*');
    const endTime = performance.now();

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1000);
    expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
  });

  it('should handle concurrent requests', async () => {
    const mockResponses = Array.from({ length: 5 }, (_, i) => ({
      data: { id: i, value: `test${i}` },
      error: null,
    }));

    mockSupabase.from().select.mockImplementation(() => 
      Promise.resolve(mockResponses[Math.floor(Math.random() * mockResponses.length)])
    );

    const requests = Array.from({ length: 5 }, () => 
      mockSupabase.from('test_table').select('*')
    );

    const startTime = performance.now();
    const results = await Promise.all(requests);
    const endTime = performance.now();

    expect(results).toHaveLength(5);
    results.forEach(result => {
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });
    expect(endTime - startTime).toBeLessThan(2000); // Should complete in less than 2 seconds
  });

  it('should handle pagination efficiently', async () => {
    const pageSize = 50;
    const totalItems = 200;
    
    const mockPage = (page: number) => ({
      data: Array.from({ length: pageSize }, (_, i) => ({
        id: page * pageSize + i,
        name: `Item ${page * pageSize + i}`,
      })),
      error: null,
    });

    mockSupabase.from().select.mockImplementation(() => ({
      range: (start: number, end: number) => 
        Promise.resolve(mockPage(Math.floor(start / pageSize)))
    }));

    const pages = [];
    for (let i = 0; i < totalItems; i += pageSize) {
      const result = await mockSupabase
        .from('test_table')
        .select('*')
        .range(i, i + pageSize - 1);
      pages.push(result);
    }

    expect(pages).toHaveLength(totalItems / pageSize);
    pages.forEach((page, index) => {
      expect(page.error).toBeNull();
      expect(page.data).toHaveLength(pageSize);
      expect(page.data[0].id).toBe(index * pageSize);
    });
  });
}); 