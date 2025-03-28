import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// Định nghĩa kiểu dữ liệu từ file Excel
interface ExcelRow {
  InputTime: string | number;
  Time: string | number;
  Amount: string | number;
  Balance: string | number;
}

// Định nghĩa kiểu dữ liệu hiển thị trên biểu đồ
interface ChartData {
  date: string;
  income: number;
  used: number;
  balance: number;
}

const StatisticsPage: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<
    "income" | "used" | "balance" | "all"
  >("all");

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

      // Chuyển dữ liệu từ Excel sang JSON
      const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json<ExcelRow>(sheet, {
        raw: false,
        defval: "",
      });
      console.log("Raw Excel Data:", jsonData); // Kiểm tra dữ liệu gốc

      // Xử lý dữ liệu cho biểu đồ
      const formattedData: ChartData[] = jsonData
        .map((row) => {
          // Chuyển đổi InputTime (có thể là số serial hoặc text)
          const dateStr = convertExcelDate(row.InputTime);
          if (!dateStr) {
            console.warn("Dữ liệu InputTime không hợp lệ:", row.InputTime);
            return null; // Bỏ qua dòng bị lỗi
          }

          // Chuyển đổi Amount và Balance thành số hợp lệ
          const amount = Number(row.Amount?.toString().replace(/,/g, "") || 0);
          const balance = Number(
            row.Balance?.toString().replace(/,/g, "") || 0
          );

          return {
            date: dateStr,
            income: amount > 0 ? amount : 0,
            used: amount < 0 ? Math.abs(amount) : 0,
            balance: isNaN(balance) ? 0 : balance,
          };
        })
        .filter((row): row is ChartData => row !== null) // Lọc bỏ các dòng null
        .sort((a, b) => a.date.localeCompare(b.date)); // Sắp xếp theo ngày

      console.log("Formatted Data:", formattedData); // Kiểm tra dữ liệu sau khi xử lý
      setData(formattedData);
    };
    reader.readAsBinaryString(file);
  };

  /** Chuyển Excel Serial Number hoặc text date thành chuỗi yyyy-mm-dd */
  const convertExcelDate = (value: string | number): string => {
    if (typeof value === "number") {
      console.log(value, " + ", typeof value);
      // Xử lý Excel Serial Number (ngày Excel)
      const excelStartDate = new Date(1900, 0, 0);
      const convertedDate = new Date(
        excelStartDate.getTime() + (value - 1) * 24 * 60 * 60 * 1000
      );
      return convertedDate.toISOString().split("T")[0]; // yyyy-mm-dd
    }

    if (typeof value === "string") {
      // Xử lý ngày dưới dạng chuỗi "dd/mm/yyyy"
      console.log(value, " + ", typeof value);
      const [day, month, year] = value.split("/").map(Number);
      console.log(day, "/", month, "/", year);
      if (!day || !month || !year) return "";
      return `${day.toString().padStart(2, "0")}/${month
        .toString()
        .padStart(2, "0")}/${year}`;
    }

    return "";
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Thống kê tài chính</h2>

      {/* File Upload */}
      <input
        type="file"
        accept=".xlsx, .xls, .csv"
        onChange={handleFileUpload}
      />

      {/* Bộ lọc dữ liệu */}
      <div style={{ margin: "20px 0" }}>
        <label>
          <input
            type="radio"
            name="metric"
            value="income"
            onChange={() => setSelectedMetric("income")}
          />{" "}
          Income
        </label>
        <label style={{ marginLeft: "10px" }}>
          <input
            type="radio"
            name="metric"
            value="used"
            onChange={() => setSelectedMetric("used")}
          />{" "}
          Used
        </label>
        <label style={{ marginLeft: "10px" }}>
          <input
            type="radio"
            name="metric"
            value="balance"
            onChange={() => setSelectedMetric("balance")}
          />{" "}
          Balance
        </label>
        <label style={{ marginLeft: "10px" }}>
          <input
            type="radio"
            name="metric"
            value="all"
            checked={selectedMetric === "all"}
            onChange={() => setSelectedMetric("all")}
          />{" "}
          All
        </label>
      </div>

      {/* Hiển thị biểu đồ */}
      <div style={{ width: "80%", height: "400px", margin: "0 auto" }}>
        <ResponsiveContainer width="100%" height="100%">
          {selectedMetric === "all" ? (
            // Biểu đồ kết hợp (Income + Used + Balance)
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#4CAF50" />
              <Line type="monotone" dataKey="used" stroke="#FF5722" />
              <Line type="monotone" dataKey="balance" stroke="#2196F3" />
            </LineChart>
          ) : (
            // Biểu đồ cột (Income, Used, hoặc Balance)
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey={selectedMetric}
                fill={
                  selectedMetric === "income"
                    ? "#4CAF50"
                    : selectedMetric === "used"
                    ? "#FF5722"
                    : "#2196F3"
                }
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatisticsPage;
