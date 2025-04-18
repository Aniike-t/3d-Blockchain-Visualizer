// --- TransactionForm.jsx ---
import React, { useState } from 'react';

const TransactionForm = ({ onAddTransaction, isAdding }) => {
  const [fromAddr, setFromAddr] = useState('');
  const [toAddr, setToAddr] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!fromAddr.trim() || !toAddr.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please fill in valid From, To, and a positive Amount.');
      return;
    }
    if (isAdding) return; // Prevent double submission

    onAddTransaction({
      from_addr: fromAddr,
      to_addr: toAddr,
      amount: parsedAmount,
    });

    // Clear form after submission
    setFromAddr('');
    setToAddr('');
    setAmount('');
  };

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <h3>Add Transaction to Mempool</h3>
      <input
        type="text"
        value={fromAddr}
        onChange={(e) => setFromAddr(e.target.value)}
        placeholder="From Address (e.g., Alice)"
        disabled={isAdding}
        required
        aria-label="From Address"
      />
      <input
        type="text"
        value={toAddr}
        onChange={(e) => setToAddr(e.target.value)}
        placeholder="To Address (e.g., Bob)"
        disabled={isAdding}
        required
        aria-label="To Address"
      />
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount (e.g., 10)"
        min="0.01" // Example minimum
        step="any" // Allow decimals
        disabled={isAdding}
        required
        aria-label="Transaction Amount"
      />
      <button type="submit" disabled={isAdding || !fromAddr.trim() || !toAddr.trim() || !amount.trim()}>
        {isAdding ? 'Adding...' : 'Add to Mempool'}
      </button>
    </form>
  );
};

export default TransactionForm;