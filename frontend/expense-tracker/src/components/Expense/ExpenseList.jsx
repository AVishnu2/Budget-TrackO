import React from "react";
import TransactionInfoCard from "../Cards/TransactionInfoCard";
import moment from "moment";
import { AiOutlineDownload } from "react-icons/ai";

const ExpenseList = ({ transactions, onDelete, onDownload }) => {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h5 className="text-lg">All Expenses</h5>

        <button className="card-btn" onClick={onDownload}>
          <AiOutlineDownload className="text-base" /> Download
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {transactions && transactions.length > 0 ? (
          transactions.map((expense) => (
            <TransactionInfoCard
              key={expense._id}
              title={expense.category}
              icon={expense.icon}
              date={moment(expense.date).format("Do MMM YYYY")}
              amount={expense.amount}
              type="expense"
              onDelete={() => onDelete(expense._id)}
            />
          ))
        ) : (
          <div className="col-span-2 text-center py-8 text-gray-500">
            No expense records found. Add expense or import from CSV.
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseList;

