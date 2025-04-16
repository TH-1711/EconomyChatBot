import React, { useState } from "react";
import * as XLSX from "xlsx";

// Định nghĩa cấu trúc của dữ liệu Excel
interface ExcelRow {
  "Thời gian ghi nhận": string | number;
  "Thời gian giao dịch": string | number;
  "Số tiền": string | number;
  "Danh mục": string;
  "Ghi chú": string;
}

// Định nghĩa cấu trúc của Transaction
interface Transaction {
  "Thời gian ghi nhận": string;
  "Thời gian giao dịch": string;
  "Số tiền": number;
  "Danh mục": string;
  "Ghi chú": string;
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

      // Đọc workbook từ file Excel
      const workbook = XLSX.read(binaryString, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Chuyển sheet thành JSON với các trường mặc định (defval để đảm bảo giá trị rỗng được đọc)
      const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: "" });

      // Xử lý dữ liệu: chuyển đổi kiểu, format ngày tháng, số tiền,...
      const formattedData: Transaction[] = jsonData
        .map((row) => {
          // Xử lý "Thời gian ghi nhận"
          let thoiGianGhiNhan = row["Thời gian ghi nhận"].toString().trim();
          thoiGianGhiNhan = isValidDateString(thoiGianGhiNhan)
            ? thoiGianGhiNhan
            : convertExcelDate(row["Thời gian ghi nhận"]);

          // Xử lý "Thời gian giao dịch"
          let thoiGianGiaoDich = row["Thời gian giao dịch"].toString().trim();
          thoiGianGiaoDich = isValidDateString(thoiGianGiaoDich)
            ? thoiGianGiaoDich
            : convertExcelDate(row["Thời gian giao dịch"]);

          // Chuyển đổi số tiền
          const soTien = formatNumber(row["Số tiền"]);

          // Lấy các trường Danh mục, Loại, Ghi chú
          const danhMuc = row["Danh mục"].toString().trim();
          const ghiChu = row["Ghi chú"].toString().trim();

          return {
            "Thời gian ghi nhận": thoiGianGhiNhan,
            "Thời gian giao dịch": thoiGianGiaoDich,
            "Số tiền": soTien,
            "Danh mục": danhMuc,
            "Ghi chú": ghiChu,
          };
        })
        .sort((a, b) => {
          // Sắp xếp theo "Thời gian ghi nhận" trước, nếu bằng thì theo "Thời gian giao dịch"
          const dateCompare = compareDates(a["Thời gian ghi nhận"], b["Thời gian ghi nhận"]);
          return dateCompare !== 0
            ? dateCompare
            : compareDates(a["Thời gian giao dịch"], b["Thời gian giao dịch"]);
        });

      console.log("Formatted Data:", formattedData);
      setData(formattedData);
    };
    reader.readAsBinaryString(file);
  };

  /** Kiểm tra chuỗi ngày có đúng định dạng dd/mm/yyyy không */
  const isValidDateString = (date: string): boolean => {
    return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date);
  };

  /** Chuyển đổi Excel serial number thành chuỗi ngày dd/mm/yyyy */
  const convertExcelDate = (value: string | number): string => {
    if (typeof value === "number") {
      // Lưu ý: Excel có bug ngày 1900, nên trừ 2 ngày (trừ 1 cho bug và 1 vì Excel tính ngày bắt đầu từ 1)
      const excelEpoch = new Date(1900, 0, 1);
      const converted = new Date(excelEpoch.getTime() + (value - 2) * 86400000);
      const day = String(converted.getDate()).padStart(2, "0");
      const month = String(converted.getMonth() + 1).padStart(2, "0");
      const year = converted.getFullYear();
      return `${day}/${month}/${year}`;
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
    return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
  };

  return (
    <div className="history-container" style={containerStyle}>
      <h2>Lịch sử giao dịch</h2>
      <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
      {data.length > 0 && (
        <table style={tableStyle}>
          <thead>
            <tr style={headerStyle}>
              <th style={cellHeaderStyle}>Thời gian ghi nhận</th>
              <th style={cellHeaderStyle}>Thời gian giao dịch</th>
              <th style={cellHeaderStyle}>Số tiền</th>
              <th style={cellHeaderStyle}>Danh mục</th>
              <th style={cellHeaderStyle}>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} style={index % 2 === 0 ? rowEvenStyle : rowOddStyle}>
                <td style={cellStyle}>{row["Thời gian ghi nhận"]}</td>
                <td style={cellStyle}>{row["Thời gian giao dịch"]}</td>
                <td style={cellStyle}>{row["Số tiền"].toLocaleString()} VND</td>
                <td style={cellStyle}>{row["Danh mục"]}</td>
                <td style={cellStyle}>{row["Ghi chú"]}</td>
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
