import { Injectable } from '@nestjs/common';
import Transaction from 'src/type/transaction';
import { AIService } from 'src/ai/ai.service';
import * as fs  from 'fs';
import * as path from 'path';
import { DateTime } from 'luxon';
import botResponse from 'src/type/botResponse';
import { getDataPath } from 'src/utils/path.util';



import * as XLSX from 'xlsx';





@Injectable()
export class TransactionService {
  // Cơ sở dữ liệu giả sử dùng in-memory store
  constructor(private readonly bot: AIService) {}
  private readonly transactionPath = getDataPath('transactionHistory.json');
  private readonly cmdPath = getDataPath('cmdHistory.json');
  /**
   * Xử lý tin nhắn nhập vào.
   * Nếu tin nhắn có chứa lệnh /add, giả lập việc trích xuất thông tin giao dịch.
   * Nếu không, trả về một phản hồi chat thông thường.
   */
  async processMessage(message: string)
  {
    try {
        const lang = await this.bot.detectLanguage(message);
        //if (lang !== 'vi') message = await this.bot.translateMessage(message);
        const botRes=await this.bot.processMessage(message);
        const transaction = botRes[0];
        const responseText = botRes[1];
        const type = botRes[2];
        const cmd = botRes[3];
        const response: botResponse = {
            status: "success",
            message: responseText,
            botMessage: cmd,
            type: type, 
            data: transaction,
        };
        let res;
        if(type ==1) res=await this.addTransaction(transaction,cmd);
        console.log(res);
        return response;
    }
    catch (error) {
        console.error(`Error processing message: ${error}`);
        return [null, 'Có lỗi xảy ra trong quá trình xử lý tin nhắn.'];
        }

  }

  async exportToExcel() {
    try {
      if (!fs.existsSync(this.transactionPath)) {
        return {
          status: 'error',
          message: 'File transactionHistory.json không tồn tại',
        };
      }
  
      const data = await fs.promises.readFile(this.transactionPath, 'utf8');
      const transactions: Transaction[] = data
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (err) {
            console.warn(`⚠️ Bỏ qua dòng lỗi khi parse JSON: ${line}`);
            return null;
          }
        })
        .filter((t): t is Transaction => t !== null);
  
      // Nếu không có dữ liệu thì báo lỗi
      if (transactions.length === 0) {
        return {
          status: 'error',
          message: 'Không có dữ liệu để export',
        };
      }
  
      // Chuyển thành worksheet
      const desiredHeader = [
        'Thời gian ghi nhận',
        'Thời gian giao dịch',
        'Số tiền',
        'Danh mục',
        'Loại',
        'Ghi chú'
      ];
      
      const worksheet = XLSX.utils.json_to_sheet(transactions,{header: desiredHeader});
      XLSX.utils.sheet_add_aoa(worksheet, [desiredHeader], { origin: 'A1' });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
  
      const excelPath = getDataPath('transactionHistory.xlsx');
      XLSX.writeFile(workbook, excelPath);
  
      return {
        status: 'success',
        message: 'Đã export dữ liệu ra file Excel thành công',
        path: excelPath,
      };
    } catch (error) {
      console.error('Lỗi khi export Excel:', error);
      return {
        status: 'error',
        message: 'Có lỗi xảy ra trong quá trình export file Excel',
      };
    }
  }
  
  

  async addTransaction(transaction: Transaction|null,cmd:string) {
    try{
        if (!transaction) {
        return {
            status: "error",
            message: "Transaction is null"
        };
        }


        let transactions: Transaction[] = [];

        if (fs.existsSync(this.transactionPath)) {
        const data = await fs.promises.readFile(this.transactionPath, 'utf8');
        transactions = data
                        .split("\n")
                        .map(line => line.trim())
                        .filter(line => line.length > 0)
                        .map(line => {
                            try {
                            return JSON.parse(line);
                            } catch (err) {
                            console.warn(`⚠️ Bỏ qua dòng không hợp lệ trong transactionHistory.json: ${line}`);
                            return null;
                            }
                        })
                        .filter(t => t !== null);

        }

        transactions.push(transaction);
        transactions = transactions.filter((t): t is Transaction => t !== null);

        transactions.sort((a: Transaction, b: Transaction) => {
            const dateA = DateTime.fromFormat(a["Thời gian giao dịch"], "dd/MM/yyyy");
            const dateB = DateTime.fromFormat(b["Thời gian giao dịch"], "dd/MM/yyyy");
            console.log('sorting:', a["Thời gian giao dịch"], b["Thời gian giao dịch"]);
            const dif=dateA.toMillis() - dateB.toMillis();
            console.log('dif:', dif);
            return dateA.toMillis() - dateB.toMillis();
          });
          


        const newFileContent = transactions.map(t => JSON.stringify(t)).join("\n") + "\n";
        await fs.promises.writeFile(this.transactionPath, newFileContent, 'utf8');
        this.exportToExcel(); // Gọi hàm exportToExcel sau khi thêm giao dịch mới
        
        const cmdLine = JSON.stringify(cmd) + "\n";
        await fs.promises.appendFile(this.cmdPath, cmdLine, 'utf8');
        return {
            status: "success",
            message: "Thêm giao dịch thành công",
            data: transaction,
            cmd: cmd
        };
    }
    catch (error) {
        console.error(`Error adding transaction: ${error}`);
        return {
            status: "error",
            message: "Có lỗi xảy ra trong quá trình thêm giao dịch."
        };
    }
  }

  async getAllTransactions(){
    try {
        const data = await fs.promises.readFile(this.transactionPath, 'utf8');
        const transactions = data
            .split("\n")
            .filter(line => line.trim())
            .map(line => JSON.parse(line));
        return {
            status: "success",
            message: "Đã đọc tất cả giao dịch",
            data: transactions,
        }
    } catch (error) {
        console.error(`Error reading transactions: ${error}`);
        return {
            status: "error",
            message: "Có lỗi xảy ra trong quá trình đọc giao dịch.",
            data: null,
        }
    }

  }

  async getTransactionByInputTime(inputTime: string) {
    
  }


  async deleteTransaction(inputTime: string) {
    try {
        const data = await fs.promises.readFile(this.transactionPath, 'utf8');
        const transactions = data
            .split("\n")
            .filter(line => line.trim())
            .map(line => JSON.parse(line));
        const transactionIndex = transactions.findIndex(tx => tx["Thời gian ghi nhận"] === inputTime);
        if (transactionIndex === -1) {
            return {
                status: "error",
                message: "Không tìm thấy giao dịch",
                data: null,
            };
        }
        const deletedTransaction = transactions.splice(transactionIndex, 1)[0];
        const newFileContent = transactions.map(t => JSON.stringify(t)).join("\n") + "\n";
        await fs.promises.writeFile(this.transactionPath, newFileContent, 'utf8');
        return {
            status: "success",
            message: "Đã xoá giao dịch",
            data: deletedTransaction,
        };
    } catch (error) {
        console.error(`Error deleting transaction: ${error}`);
        return {
            status: "error",
            message: "Có lỗi xảy ra trong quá trình xoá giao dịch.",
            data: null,
        };
    }
  }
  /**
   * Tìm giao dịch dựa trên ngày và giờ.
   * Ở đây ta dùng so sánh đơn giản trên trường time (dd/mm/yyyy).
   */
//   getTransactionByDateTime(day: string, _time: string): Transaction | null {
//     for (const key in this.transactionsDb) {
//       const tx = this.transactionsDb[key];
//       if (tx.time === day) { // so sánh đơn giản, có thể mở rộng
//         return tx;
//       }
//     }
//     return null;
//   }

//   updateTransaction(inputTime: string, updateData: Partial<Transaction>): Transaction | null {
//     const transaction = this.transactionsDb[inputTime];
//     if (!transaction) {
//       return null;
//     }
//     const updatedTransaction = { ...transaction, ...updateData };
//     this.transactionsDb[inputTime] = updatedTransaction;
//     return updatedTransaction;
//   }

//   deleteTransaction(inputTime: string): Transaction | null {
//     const transaction = this.transactionsDb[inputTime];
//     if (transaction) {
//       delete this.transactionsDb[inputTime];
//       return transaction;
//     }
//     return null;
//   }

//   deleteAllTransactions(): void {
//     this.transactionsDb = {};
//   }
}
