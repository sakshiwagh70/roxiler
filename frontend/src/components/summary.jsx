import React from 'react';

const SummaryTable = ({ transactions}) => {
  const totalSales = transactions.reduce((acc, transaction) => 
    acc + (transaction.sold ? transaction.price : 0), 0);
  const totalSold = transactions.filter(transaction => transaction.sold).length;
  const totalNotSold = transactions.length - totalSold;

  return (
    <div>
      <h2>Summary </h2>
      <table border="1" style={{ width: "100%", marginTop: "20px" }}>
        <thead>
          <tr>
            <th>Amount of Sale</th>
            <th>Sold Items</th>
            <th>Not Sold Items</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${totalSales.toFixed(2)}</td>
            <td>{totalSold}</td>
            <td>{totalNotSold}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default SummaryTable;
