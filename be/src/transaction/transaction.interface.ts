export interface Transaction {
    inputTime: string;  // Mã định danh giao dịch, ví dụ ISO string
    time: string;       // Thời gian giao dịch (dd/mm/yyyy)
    action: string;     // add, delete, edit, read
    criteria: string;   // tiêu chí phân loại (có thể là "Unknown" nếu không xác định)
    value: string;      // Số tiền dưới dạng chuỗi
    note: string;       // Ghi chú mô tả giao dịch
  }
  