export const mockWalletsResponse = {
  success: true,
  data: {
    totalUsers: 1,
    activeUsers: 1,
    totalTransactions: 8,
    totalVolume: 0.6600106299999999,
    totalWallets: 3,
    totalBalance: 4.253,
    chartData: [
      { date: '2025-04-01', transactions: 2, volume: 0.1 },
      { date: '2025-04-02', transactions: 3, volume: 0.25 },
      { date: '2025-04-03', transactions: 3, volume: 0.31001063 }
    ],
    recentTransactions: [
      {
        id: 'txn_123',
        date: '2025-04-03T12:34:56Z',
        amount: 0.15,
        currency: 'BTC'
      },
      {
        id: 'txn_456',
        date: '2025-04-02T11:22:33Z',
        amount: 0.1,
        currency: 'ETH'
      }
    ]
  }
};
