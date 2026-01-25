// CFD Trading Utility Functions

/**
 * Calculate liquidation price for a CFD position
 * Long: Entry - (Margin / Quantity)
 * Short: Entry + (Margin / Quantity)
 */
export function calculateLiquidationPrice(
  direction: 'long' | 'short',
  entryPrice: number,
  margin: number,
  quantity: number
): number {
  if (quantity === 0) return 0;
  
  const marginPerUnit = margin / quantity;
  
  if (direction === 'long') {
    return entryPrice - marginPerUnit;
  } else {
    return entryPrice + marginPerUnit;
  }
}

/**
 * Calculate required margin for a position
 * Margin = (Price × Quantity) / Leverage
 */
export function calculateRequiredMargin(
  price: number,
  quantity: number,
  leverage: number
): number {
  if (leverage === 0) return 0;
  return (price * quantity) / leverage;
}

/**
 * Calculate position P&L
 */
export function calculatePnL(
  direction: 'long' | 'short',
  entryPrice: number,
  currentPrice: number,
  quantity: number
): number {
  const priceDiff = currentPrice - entryPrice;
  
  if (direction === 'long') {
    return priceDiff * quantity;
  } else {
    return -priceDiff * quantity;
  }
}

/**
 * Calculate P&L percentage (ROI)
 */
export function calculatePnLPercentage(
  pnl: number,
  margin: number
): number {
  if (margin === 0) return 0;
  return (pnl / margin) * 100;
}

/**
 * Calculate margin level percentage
 * Margin Level = (Equity / Used Margin) * 100
 */
export function calculateMarginLevel(
  equity: number,
  usedMargin: number
): number {
  if (usedMargin === 0) return 100;
  return (equity / usedMargin) * 100;
}

/**
 * Get margin status based on margin level
 */
export function getMarginStatus(marginLevel: number): 'healthy' | 'warning' | 'danger' {
  if (marginLevel >= 150) return 'healthy';
  if (marginLevel >= 100) return 'warning';
  return 'danger';
}

/**
 * Format currency with proper decimals
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format crypto quantity
 */
export function formatQuantity(value: number, decimals: number = 4): string {
  return value.toFixed(decimals);
}
