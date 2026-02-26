import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AiOutlineUpload, 
  AiOutlineDownload, 
  AiOutlineFile, 
  AiOutlineCheckCircle, 
  AiOutlineCloseCircle, 
  AiOutlineWarning 
} from 'react-icons/ai';
import toast from 'react-hot-toast';

const CSVImport = ({ type = 'expense', onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'expense' ? '/api/v1/expense/import-csv' : '/api/v1/income/import-csv';
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      console.log('CSV Import Result:', result); // Debug log

      if (result.success) {
        setImportResult(result);
        toast.success(result.message);
        alert(`Success! Imported ${result.summary?.imported || 0} records`); // Quick debug
        if (onImportSuccess) {
          onImportSuccess(result);
        }
      } else {
        toast.error(result.message || 'Import failed');
        alert(`Import failed: ${result.message}`); // Quick debug
        setImportResult(result);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload file: ${error.message}`);
      alert(`Error: ${error.message}`); // Quick debug
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const endpoint = type === 'expense' ? '/api/v1/expense/csv-template' : '/api/v1/income/csv-template';
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_template.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Template downloaded successfully');
      } else {
        toast.error('Failed to download template');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download template');
    }
  };

  const resetImport = () => {
    setFile(null);
    setImportResult(null);
    setShowDetails(false);
    // Reset file input
    const fileInput = document.getElementById(`csv-file-${type}`);
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <AiOutlineUpload className="text-primary" />
          Import {type === 'expense' ? 'Expenses' : 'Income'} from CSV
        </h3>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <AiOutlineDownload size={16} />
          Download Template
        </button>
      </div>

      {/* File Upload Section */}
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
          <input
            id={`csv-file-${type}`}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <label
            htmlFor={`csv-file-${type}`}
            className="cursor-pointer flex flex-col items-center gap-3"
          >
            <AiOutlineFile size={48} className="text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-700">
                {file ? file.name : 'Choose CSV file'}
              </p>
              <p className="text-sm text-gray-500">
                Click to browse or drag and drop
              </p>
            </div>
          </label>
        </div>

        {file && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <AiOutlineFile className="text-primary" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <AiOutlineUpload size={16} />
                    Import
                  </>
                )}
              </button>
              <button
                onClick={resetImport}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import Results */}
      {importResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-4"
        >
          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              {importResult.success ? (
                <AiOutlineCheckCircle className="text-green-500" />
              ) : (
                <AiOutlineCloseCircle className="text-red-500" />
              )}
              Import Summary
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {importResult.summary?.totalRows || 0}
                </div>
                <div className="text-sm text-gray-600">Total Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.summary?.imported || 0}
                </div>
                <div className="text-sm text-gray-600">Imported</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.summary?.invalidRows || 0}
                </div>
                <div className="text-sm text-gray-600">Invalid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {(importResult.summary?.internalDuplicates || 0) + (importResult.summary?.existingDuplicates || 0)}
                </div>
                <div className="text-sm text-gray-600">Duplicates</div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <div className="text-lg font-semibold">
                Success Rate: {importResult.summary?.successRate || 0}%
              </div>
            </div>
          </div>

          {/* Details Toggle */}
          {(importResult.details?.invalidRows?.length > 0 || 
            importResult.details?.internalDuplicates?.length > 0 || 
            importResult.details?.existingDuplicates?.length > 0) && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <AiOutlineWarning size={16} />
              {showDetails ? 'Hide' : 'Show'} Details
            </button>
          )}

          {/* Detailed Results */}
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              {/* Invalid Rows */}
              {importResult.details?.invalidRows?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h5 className="font-semibold text-red-800 mb-2">
                    Invalid Rows ({importResult.details.invalidRows.length})
                  </h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {importResult.details.invalidRows.map((row, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium">Row {row.rowIndex}:</span>
                        <ul className="ml-4 text-red-700">
                          {row.errors.map((error, i) => (
                            <li key={i}>• {error.field}: {error.message}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicates */}
              {(importResult.details?.internalDuplicates?.length > 0 || 
                importResult.details?.existingDuplicates?.length > 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h5 className="font-semibold text-yellow-800 mb-2">
                    Duplicate Entries ({(importResult.details?.internalDuplicates?.length || 0) + (importResult.details?.existingDuplicates?.length || 0)})
                  </h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto text-sm text-yellow-700">
                    {importResult.details?.internalDuplicates?.map((dup, index) => (
                      <div key={index}>
                        Row {dup.rowIndex}: {dup.reason}
                      </div>
                    ))}
                    {importResult.details?.existingDuplicates?.map((dup, index) => (
                      <div key={index}>
                        Row {dup.rowIndex}: {dup.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* CSV Format Guide */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">CSV Format Requirements</h4>
        <div className="text-sm text-blue-700 space-y-1">
          {type === 'expense' ? (
            <>
              <p><strong>Required columns:</strong> name, amount, category, date</p>
              <p><strong>Optional columns:</strong> merchant, currency</p>
              <p><strong>Date formats:</strong> YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY</p>
              <p><strong>Example:</strong> Coffee,50,Food,Starbucks,2024-01-15,INR</p>
            </>
          ) : (
            <>
              <p><strong>Required columns:</strong> source, amount, date</p>
              <p><strong>Date formats:</strong> YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY</p>
              <p><strong>Example:</strong> Salary,50000,2024-01-01</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVImport;
