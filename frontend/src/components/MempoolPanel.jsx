// --- MempoolPanel.jsx ---
import React from 'react';

const MempoolPanel = ({ transactions }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="mempool-panel empty">
        <h4>Mempool</h4>
        <p>No pending transactions.</p>
      </div>
    );
  }

  return (
    <div className="mempool-panel">
      <h4>Mempool ({transactions.length} Pending)</h4>
      <ul>
        {transactions.map((tx, index) => (
          <li key={index}>
            <span>From: {tx.from_addr}</span>
            <span>To: {tx.to_addr}</span>
            <span>Amount: {tx.amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MempoolPanel;