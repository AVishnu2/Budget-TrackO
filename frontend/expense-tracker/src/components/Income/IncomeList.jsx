import React from "react";
import TransactionInfoCard from "../Cards/TransactionInfoCard";
import moment from "moment";
import { AiOutlineDownload } from "react-icons/ai";

const IncomeList = ({ transactions, onDelete, onDownload }) => {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h5 className="text-lg">Income Sources</h5>

        <button className="card-btn" onClick={onDownload}>
          <AiOutlineDownload className="text-base" /> Download
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {transactions && transactions.length > 0 ? (
          transactions.map((income) => (
            <TransactionInfoCard
              key={income._id}
              title={income.source}
              icon={income.icon}
              date={moment(income.date).format("Do MMM YYYY")}
              amount={income.amount}
              type="income"
              onDelete={() => onDelete(income._id)}
            />
          ))
        ) : (
          <div className="col-span-2 text-center py-8 text-gray-500">
            No income records found. Add income or import from CSV.
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeList;
