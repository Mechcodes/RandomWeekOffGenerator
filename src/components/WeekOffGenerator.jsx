// components/WeekOffGenerator.jsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { generateWeekOffs } from '../utils/generateWeekOffs';

const WeekOffGenerator = () => {
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [weekRange, setWeekRange] = useState({ from: '', to: '' });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      setFileData(data);
    };
    reader.readAsBinaryString(file);
  };

  const handleDownload = () => {
    if (!fileData || !weekRange.from || !weekRange.to) return alert("Please upload file and select date range");

    const labeledData = fileData.map(row => ({
      ...row,
      WeekOffRange: `${weekRange.from} to ${weekRange.to}`
    }));

    const updatedData = generateWeekOffs(labeledData);
    const newWorksheet = XLSX.utils.json_to_sheet(updatedData);
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'WeekOffs');

    const excelBuffer = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `WeekOff_${weekRange.from}_${fileName}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-purple-100 flex justify-center items-center p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-xl space-y-6">
        <h1 className="text-2xl font-bold text-center text-purple-700">🌟 Week Off Generator</h1>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Excel File</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Date Range */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Week Start Date</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={weekRange.from}
              onChange={(e) => setWeekRange(prev => ({ ...prev, from: e.target.value }))}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Week End Date</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={weekRange.to}
              onChange={(e) => setWeekRange(prev => ({ ...prev, to: e.target.value }))}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between items-center">
          {fileName && (
            <p className="text-green-600 text-sm">✅ File ready: <strong>{fileName}</strong></p>
          )}
          <button
            onClick={handleDownload}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-md shadow-md transition"
          >
            Download Week Off File
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeekOffGenerator;
