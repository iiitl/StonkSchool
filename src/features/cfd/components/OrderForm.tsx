'use client';

import React, { useState, useMemo, memo } from 'react';
import { useCfd, useLivePrices } from '../store/cfdStore';
import { 
  calculateRequiredMargin, 
  calculateLiquidationPrice, 
  formatCurrency 
} from '../utils/calculations';
import LeverageSelector from './LeverageSlider';
import { PositionSide } from '../types';

function OrderForm() {
  const { 
    selectedAsset, 
    selectedLeverage, 
    assets,
    isSubmitting,
    setAsset, 
    setLeverage,
    openPosition 
  } = useCfd();

  const { prices, liveFreeMargin } = useLivePrices();

  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [amountType, setAmountType] = useState<'units' | 'margin'>('units');
  const [amount, setAmount] = useState<string>('0.01');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const price = prices[selectedAsset];
  const entryPrice = direction === 'long' ? price?.ask : price?.bid;

  // Get available assets from API
  const availableAssets = assets.filter(a => a.is_active);

  // Get max leverage for selected asset
  const selectedAssetData = assets.find(a => a.symbol === selectedAsset);
  const maxLeverage = selectedAssetData?.max_leverage || 20;

  // Calculate margin and liquidation
  const calculations = useMemo(() => {
    const qty = amountType === 'units' ? parseFloat(amount) || 0 : 0;
    const margin = amountType === 'units' 
      ? calculateRequiredMargin(entryPrice || 0, qty, selectedLeverage)
      : parseFloat(amount) || 0;
    
    const actualQty = amountType === 'margin' 
      ? (margin * selectedLeverage) / (entryPrice || 1)
      : qty;
    
    const liqPrice = calculateLiquidationPrice(
      direction, 
      entryPrice || 0, 
      margin, 
      actualQty
    );

    const slLoss = stopLoss ? 
      Math.abs((parseFloat(stopLoss) - (entryPrice || 0)) * actualQty) : 
      null;
    
    const tpProfit = takeProfit ? 
      Math.abs((parseFloat(takeProfit) - (entryPrice || 0)) * actualQty) : 
      null;

    return { margin, liqPrice, actualQty, slLoss, tpProfit };
  }, [amount, amountType, entryPrice, selectedLeverage, direction, stopLoss, takeProfit]);

  const canTrade = calculations.margin > 0 && calculations.margin <= liveFreeMargin && !isSubmitting;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setSubmitError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setSubmitError('Amount must be a positive number');
      return;
    }

    if (stopLoss !== '') {
      const parsedSL = parseFloat(stopLoss);
      if (isNaN(parsedSL) || parsedSL < 0) {
        setSubmitError('Stop Loss must be a positive number');
        return;
      }
      if (entryPrice !== undefined) {
        if (direction === 'long' && parsedSL >= entryPrice) {
          setSubmitError('Stop Loss must be below entry price for Long positions');
          return;
        }
        if (direction === 'short' && parsedSL <= entryPrice) {
          setSubmitError('Stop Loss must be above entry price for Short positions');
          return;
        }
      }
    }

    if (takeProfit !== '') {
      const parsedTP = parseFloat(takeProfit);
      if (isNaN(parsedTP) || parsedTP < 0) {
        setSubmitError('Take Profit must be a positive number');
        return;
      }
      if (entryPrice !== undefined) {
        if (direction === 'long' && parsedTP <= entryPrice) {
          setSubmitError('Take Profit must be above entry price for Long positions');
          return;
        }
        if (direction === 'short' && parsedTP >= entryPrice) {
          setSubmitError('Take Profit must be below entry price for Short positions');
          return;
        }
      }
    }

    if (!canTrade) return;

    try {
      await openPosition({
        symbol: selectedAsset,
        side: direction.toUpperCase() as PositionSide,
        quantity: calculations.actualQty,
        leverage: selectedLeverage,
        stop_loss: stopLoss ? parseFloat(stopLoss) : undefined,
        take_profit: takeProfit ? parseFloat(takeProfit) : undefined,
      });

      // Reset form on success
      setAmount('0.01');
      setStopLoss('');
      setTakeProfit('');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to open position');
    }
  };

  return (
    <form className="order-form" onSubmit={handleSubmit}>
      <div className="card-header">
        <span>New Position</span>
      </div>
      
      <div className="card-body">
        {/* Asset Selector */}
        <div className="form-group">
          <label className="input-label" htmlFor="asset-select">Asset</label>
          <select 
            id="asset-select"
            className="input asset-select"
            value={selectedAsset}
            onChange={(e) => setAsset(e.target.value)}
          >
            {availableAssets.length > 0 ? (
              availableAssets.map(asset => (
                <option key={asset.id} value={asset.symbol}>{asset.symbol}</option>
              ))
            ) : (
              <option value={selectedAsset}>{selectedAsset}</option>
            )}
          </select>
        </div>

        {/* Direction Buttons */}
        <div className="form-group">
          <label className="input-label" id="direction-label">Direction</label>
          <div className="direction-buttons" role="radiogroup" aria-labelledby="direction-label">
            <button 
              type="button"
              className={`direction-btn long ${direction === 'long' ? 'active' : ''}`}
              onClick={() => setDirection('long')}
            >
              <span className="dir-icon">↑</span>
              Long (Buy)
            </button>
            <button 
              type="button"
              className={`direction-btn short ${direction === 'short' ? 'active' : ''}`}
              onClick={() => setDirection('short')}
            >
              <span className="dir-icon">↓</span>
              Short (Sell)
            </button>
          </div>
        </div>

        {/* Leverage */}
        <LeverageSelector value={selectedLeverage} onChange={setLeverage} max={maxLeverage} />

        {/* Amount */}
        <div className="form-group">
          <div className="amount-header">
            <label className="input-label" htmlFor="amount-input">Amount</label>
            <div className="amount-toggle">
              <button 
                type="button"
                className={`toggle-btn ${amountType === 'units' ? 'active' : ''}`}
                onClick={() => setAmountType('units')}
              >
                Units
              </button>
              <button 
                type="button"
                className={`toggle-btn ${amountType === 'margin' ? 'active' : ''}`}
                onClick={() => setAmountType('margin')}
              >
                Margin
              </button>
            </div>
          </div>
          <input
            id="amount-input"
            type="number"
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step={amountType === 'units' ? '0.01' : '10'}
            min="0"
          />
        </div>

        {/* Advanced Options */}
        <button 
          type="button"
          className="advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? '▼' : '▶'} Stop Loss / Take Profit
        </button>

        {showAdvanced && (
          <div className="advanced-options">
            <div className="sl-tp-row">
              <div className="form-group">
                <label className="input-label" htmlFor="sl-input">Stop Loss</label>
                <input
                  id="sl-input"
                  type="number"
                  className="input"
                  placeholder="Price"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                />
                {calculations.slLoss !== null && (
                  <span className="projection loss">
                    Projected loss: -{formatCurrency(calculations.slLoss)}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="input-label" htmlFor="tp-input">Take Profit</label>
                <input
                  id="tp-input"
                  type="number"
                  className="input"
                  placeholder="Price"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                />
                {calculations.tpProfit !== null && (
                  <span className="projection profit">
                    Projected profit: +{formatCurrency(calculations.tpProfit)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Calculator Preview */}
        <div className="calc-preview">
          <div className="calc-row">
            <span>Entry Price</span>
            <span className="calc-value">{formatCurrency(entryPrice || 0)}</span>
          </div>
          <div className="calc-row">
            <span>Quantity</span>
            <span className="calc-value">{calculations.actualQty.toFixed(4)} {selectedAsset.split('/')[0]}</span>
          </div>
          <div className="calc-row">
            <span>Required Margin</span>
            <span className={`calc-value ${calculations.margin > liveFreeMargin ? 'text-danger' : ''}`}>
              {formatCurrency(calculations.margin)}
            </span>
          </div>
          <div className="calc-row highlight">
            <span>Liquidation Price</span>
            <span className="calc-value text-danger">{formatCurrency(calculations.liqPrice)}</span>
          </div>
        </div>

        {/* Submit Button */}
        <button 
          type="submit"
          className={`submit-btn ${direction === 'long' ? 'btn-buy' : 'btn-sell'}`}
          disabled={!canTrade}
        >
          {isSubmitting ? 'Opening...' : direction === 'long' ? 'Open Long Position' : 'Open Short Position'}
        </button>

        {calculations.margin > liveFreeMargin && (
          <p role="alert" className="error-text">Insufficient free margin</p>
        )}
        
        {submitError && (
          <p role="alert" className="error-text">{submitError}</p>
        )}
      </div>

      <style jsx>{`
        .order-form {
          background: var(--background);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          overflow: hidden;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .asset-select {
          appearance: none;
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M2 4l4 4 4-4'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          padding-right: 2.5rem;
        }
        
        .direction-buttons {
          display: flex;
          gap: 0.5rem;
        }
        
        .direction-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: var(--background);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .direction-btn.long:hover,
        .direction-btn.long.active {
          background: var(--success-light);
          border-color: var(--success);
          color: var(--success);
        }
        
        .direction-btn.short:hover,
        .direction-btn.short.active {
          background: var(--danger-light);
          border-color: var(--danger);
          color: var(--danger);
        }
        
        .dir-icon {
          font-size: 1rem;
        }
        
        .amount-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .amount-toggle {
          display: flex;
          gap: 0.25rem;
        }
        
        .toggle-btn {
          padding: 0.25rem 0.5rem;
          font-size: 0.7rem;
          font-weight: 500;
          color: var(--foreground-tertiary);
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }
        
        .toggle-btn.active {
          background: var(--primary-light);
          color: var(--primary);
        }
        
        .advanced-toggle {
          width: 100%;
          padding: 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--foreground-secondary);
          background: transparent;
          border: none;
          text-align: left;
          cursor: pointer;
          margin-bottom: 0.5rem;
        }
        
        .advanced-toggle:hover {
          color: var(--primary);
        }
        
        .advanced-options {
          padding: 0.75rem;
          background: var(--background-secondary);
          border-radius: var(--radius-md);
          margin-bottom: 1rem;
        }
        
        .sl-tp-row {
          display: flex;
          gap: 0.75rem;
        }
        
        .sl-tp-row .form-group {
          flex: 1;
          margin-bottom: 0;
        }
        
        .projection {
          display: block;
          font-size: 0.7rem;
          margin-top: 0.25rem;
        }
        
        .projection.loss { color: var(--danger); }
        .projection.profit { color: var(--success); }
        
        .calc-preview {
          background: var(--background-secondary);
          border-radius: var(--radius-md);
          padding: 0.875rem;
          margin-bottom: 1rem;
        }
        
        .calc-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          padding: 0.375rem 0;
          color: var(--foreground-secondary);
        }
        
        .calc-row.highlight {
          border-top: 1px dashed var(--border);
          margin-top: 0.5rem;
          padding-top: 0.625rem;
        }
        
        .calc-value {
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          color: var(--foreground);
        }
        
        .submit-btn {
          width: 100%;
          padding: 1rem;
          font-size: 0.9rem;
          font-weight: 700;
          border: none;
          border-radius: var(--radius-md);
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .submit-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }
        
        .error-text {
          text-align: center;
          font-size: 0.75rem;
          color: var(--danger);
          margin-top: 0.5rem;
        }
      `}</style>
    </form>
  );
}

export default memo(OrderForm);
