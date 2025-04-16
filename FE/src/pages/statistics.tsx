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

// Kiểu dữ liệu đầu vào từ Excel
interface ExcelRow {
  "Thời gian ghi nhận": string | number;
  "Thời gian giao dịch": string | number;
  "Số tiền": string | number;
}

// Kiểu dữ liệu hiển thị cho biểu đồ
interface ChartData {
  date: string;
  income: number;
  used: number;
  balance: number;
}

const StatisticsPage: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<"income" | "used" | "balance" | "all">("all");

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

      // Chuyển sheet Excel thành JSON (defval để đảm bảo các ô trống được lấy thành chuỗi rỗng)
      const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: "" });
      console.log("Raw Excel Data:", jsonData);

      const formattedData: ChartData[] = jsonData
        .map((row) => {
          // Sử dụng "Thời gian giao dịch" để làm ngày hiển thị (bạn có thể đổi thành "Thời gian ghi nhận" nếu muốn)
          const dateStr = convertExcelDate(row["Thời gian giao dịch"]);
          if (!dateStr) {
            console.warn("Dữ liệu Thời gian giao dịch không hợp lệ:", row["Thời gian giao dịch"]);
            return null;
          }

          const amount = parseMoney(row["Số tiền"]);

          return {
            date: dateStr,
            income: amount > 0 ? amount : 0,
            used: amount < 0 ? Math.abs(amount) : 0,
          };
        })
        .filter((row): row is ChartData => row !== null)
        .sort((a, b) => a.date.localeCompare(b.date));

      console.log("Formatted Data:", formattedData);
      setData(formattedData);
    };

    reader.readAsBinaryString(file);
  };

  /**
   * Chuyển đổi giá trị (số serial hoặc chuỗi dd/mm/yyyy) thành chuỗi yyyy-mm-dd
   */
  const convertExcelDate = (value: string | number): string => {
    if (typeof value === "number") {
      // Excel thường tính từ ngày 1/1/1900 (lưu ý có bug về năm 1900)
      const startDate = new Date(1900, 0, 0);
      const converted = new Date(startDate.getTime() + (value - 1) * 86400000);
      return converted.toISOString().split("T")[0]; // yyyy-mm-dd
    }

    if (typeof value === "string") {
      // Nếu đã có định dạng dd/mm/yyyy
      const parts = value.split("/");
      if (parts.length !== 3) return "";
      const [day, month, year] = parts.map(Number);
      if (!day || !month || !year) return "";
      // Chuyển thành định dạng yyyy-mm-dd để dễ sắp xếp
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    return "";
  };

  /**
   * Chuyển đổi giá trị Amount về dạng số
   */
  const parseMoney = (value: string | number): number => {
    if (typeof value === "string") {
      // Loại bỏ dấu phẩy, dấu chấm nếu cần
      return parseFloat(value.replace(/,/g, "").replace(/\./g, "")) || 0;
    }
    return Number(value) || 0;
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Biểu đồ thống kê tài chính</h2>

      {/* Tải file Excel */}
      <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />

      {/* Bộ lọc */}
      <div style={{ marginTop: "20px" }}>
        <label>
          <input type="radio" name="metric" value="income" onChange={() => setSelectedMetric("income")} /> Thu nhập
        </label>
        <label style={{ marginLeft: "15px" }}>
          <input type="radio" name="metric" value="used" onChange={() => setSelectedMetric("used")} /> Chi tiêu
        </label>
        <label style={{ marginLeft: "15px" }}>
          <input type="radio" name="metric" value="all" checked={selectedMetric === "all"} onChange={() => setSelectedMetric("all")} /> Tất cả
        </label>
      </div>

      {/* Biểu đồ */}
      <div style={{ width: "90%", height: "400px", margin: "30px auto" }}>
        <ResponsiveContainer width="100%" height="100%">
          {selectedMetric === "all" ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: number) => value.toLocaleString("vi-VN") + " VND"} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#4CAF50" name="Thu nhập" />
              <Line type="monotone" dataKey="used" stroke="#FF5722" name="Chi tiêu" />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: number) => value.toLocaleString("vi-VN") + " VND"} />
              <Legend />
              <Bar
                dataKey={selectedMetric}
                name={
                  selectedMetric === "income"
                    ? "Thu nhập"
                    : selectedMetric === "used"
                    ? "Chi tiêu"
                    : "Số dư"
                }
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
