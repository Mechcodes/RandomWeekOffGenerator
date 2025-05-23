// src/components/WeekOffGenerator.jsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { generateWeekOffs } from '../utils/weekOffLogic';

const Test = () => {
  const [fileName, setFileName] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [fileInput, setFileInput] = useState(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    // Reset file input when month changes
    if (fileInput) {
      fileInput.value = '';
      setFileName('');
    }
  };

  const handleFileUpload = async (e) => {
    if (!selectedMonth) {
      alert('Please select a month first');
      e.target.value = '';
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    setFileInput(e.target);
    setFileName(file.name);

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const people = XLSX.utils.sheet_to_json(sheet);

    const selectedMonthIndex = months.indexOf(selectedMonth);
    const currentYear = new Date().getFullYear();
    
    const result = generateWeekOffs(people, currentYear, selectedMonthIndex);

    const ws = XLSX.utils.json_to_sheet(result);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'WeekOffs');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(
      new Blob([wbout], { type: 'application/octet-stream' }), 
      `WeekOffs_${selectedMonth}_${currentYear}.xlsx`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-purple-100 flex justify-center items-center p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-xl space-y-6">
        <h1 className="text-2xl font-bold text-center text-purple-700">Week Off Generator</h1>
        
        {/* Month Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Month
          </label>
          <select
            value={selectedMonth}
            onChange={handleMonthChange}
            className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Choose a month</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {month} {new Date().getFullYear()}
              </option>
            ))}
          </select>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Excel File
          </label>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            disabled={!selectedMonth}
            className={`w-full p-2 border border-gray-300 rounded-md ${
              !selectedMonth ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />
          {!selectedMonth && (
            <p className="text-sm text-orange-600 mt-1">
              Please select a month first
            </p>
          )}
        </div>

        {/* File Status */}
        {fileName && (
          <div className="p-4 bg-green-50 rounded-md">
            <p className="text-green-700">
              ✅ Generated week offs for: <strong>{fileName}</strong>
            </p>
            <p className="text-sm text-green-600">
              Month: {selectedMonth} {new Date().getFullYear()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Test;
