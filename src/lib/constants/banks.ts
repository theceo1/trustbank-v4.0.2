export interface Bank {
  code: string;
  name: string;
}

export const SUPPORTED_BANKS: Bank[] = [
  { code: '044', name: 'Access Bank' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '058', name: 'Guaranty Trust Bank (GTB)' },
  // Add more banks as needed
];

export const TEST_BANKS: Bank[] = [
  { code: '044', name: 'Access Bank' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '058', name: 'Guaranty Trust Bank (GTB)' }
]; 