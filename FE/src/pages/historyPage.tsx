import React, { useState } from "react";
import * as XLSX from "xlsx";

// Define the expected structure of Excel data
interface ExcelRow {
  InputTime: string | number;
  Time: string | number;
  Amount: string | number;
  Balance: string | number;
}

// Define the structured data format
interface Transaction {
  date: string;
  time: string;
  amount: number;
  balance: number;
}

const HistoryPage: React.FC = () => {
  const [data, setData] = useState<Transaction[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const binaryString = e.target?.result;
      if (!binaryString) return;

      const workbook = XLSX.read(binaryString, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Đọc dữ liệu thô từ file Excel
      const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

      // Xử lý dữ liệu cho bảng
      const formattedData: Transaction[] = jsonData
        .map((row) => {
          // Xử lý ngày
          const dateStr = row.InputTime.toString().trim();
          const date = isValidDateString(dateStr)
            ? dateStr
            : convertExcelDate(row.InputTime);

          // Xử lý thời gian
          const timeStr = row.Time.toString().trim();
          const time = isValidTimeString(timeStr)
            ? timeStr
            : convertExcelDate(row.Time);

          return {
            date,
            time,
            amount: formatNumber(row.Amount),
            balance: formatNumber(row.Balance),
          };
        })
        .sort((a, b) => {
          // Sắp xếp theo ngày trước, sau đó theo thời gian
          const dateCompare = compareDates(a.date, b.date);
          return dateCompare !== 0 ? dateCompare : compareTimes(a.time, b.time);
        });

      console.log("Formatted Data:", formattedData); // Log kiểm tra dữ liệu đã xử lý
      setData(formattedData);
    };
    reader.readAsBinaryString(file);
  };
  /** Kiểm tra chuỗi ngày có đúng định dạng dd/mm/yyyy không */
  const isValidDateString = (date: string): boolean => {
    return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date);
  };

  /** Kiểm tra chuỗi thời gian có đúng định dạng hh:mm không */
  const isValidTimeString = (time: string): boolean => {
    return /^\d{1,2}:\d{2}$/.test(time);
  };

  /** Chuyển đổi Excel serial number thành chuỗi ngày dd/mm/yyyy */
  const convertExcelDate = (value: string | number): string => {
    if (typeof value === "number") {
      const excelStartDate = new Date(1900, 0, 0);
      const convertedDate = new Date(
        excelStartDate.getTime() + value * 24 * 60 * 60 * 1000
      );
      return convertedDate.toLocaleDateString("en-GB"); // dd/mm/yyyy
    }
    return value.toString();
  };

  /** Chuyển đổi số từ chuỗi thành dạng số hợp lệ */
  const formatNumber = (value: string | number): number => {
    if (typeof value === "string") {
      return parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
    }
    return Number(value) || 0;
  };

  /** So sánh hai ngày ở dạng dd/mm/yyyy */
  const compareDates = (dateA: string, dateB: string): number => {
    const [dayA, monthA, yearA] = dateA.split("/").map(Number);
    const [dayB, monthB, yearB] = dateB.split("/").map(Number);
    return (
      new Date(yearA, monthA - 1, dayA).getTime() -
      new Date(yearB, monthB - 1, dayB).getTime()
    );
  };

  /** So sánh hai thời gian ở dạng hh:mm */
  const compareTimes = (timeA: string, timeB: string): number => {
    const [hourA, minuteA] = timeA.split(":").map(Number);
    const [hourB, minuteB] = timeB.split(":").map(Number);
    return hourA * 60 + minuteA - (hourB * 60 + minuteB);
  };

  return (
    <div className="history-container" style={containerStyle}>
      <h2>Lịch sử giao dịch</h2>
      <input
        type="file"
        accept=".xlsx, .xls, .csv"
        onChange={handleFileUpload}
      />
      {data.length > 0 && (
        <table style={tableStyle}>
          <thead>
            <tr style={headerStyle}>
              <th style={cellHeaderStyle}>Thời gian nhập</th>
              <th style={cellHeaderStyle}>Thời gian</th>
              <th style={cellHeaderStyle}>Số tiền</th>
              <th style={cellHeaderStyle}>Số dư</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={index}
                style={index % 2 === 0 ? rowEvenStyle : rowOddStyle}
              >
                <td style={cellStyle}>{row.date}</td>
                <td style={cellStyle}>{row.time}</td>
                <td style={cellStyle}>{row.amount.toLocaleString()} VND</td>
                <td style={cellStyle}>{row.balance.toLocaleString()} VND</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  padding: "20px",
  textAlign: "center",
};
const tableStyle: React.CSSProperties = {
  marginTop: "20px",
  width: "100%",
  borderCollapse: "collapse",
};
const headerStyle: React.CSSProperties = {
  backgroundColor: "#007BFF",
  color: "white",
};
const cellHeaderStyle: React.CSSProperties = {
  padding: "10px",
  border: "1px solid #ddd",
  fontWeight: "bold",
};
const cellStyle: React.CSSProperties = {
  padding: "10px",
  border: "1px solid #ddd",
  textAlign: "center",
};
const rowEvenStyle: React.CSSProperties = { backgroundColor: "#f9f9f9" };
const rowOddStyle: React.CSSProperties = { backgroundColor: "#ffffff" };

export default HistoryPage;
