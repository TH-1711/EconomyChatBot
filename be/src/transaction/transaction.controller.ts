import { Controller, Get, Post, Put, Delete, Body, Query, Res } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import Transaction from 'src/type/transaction';
import { Response } from 'express';

@Controller('chat')
export class TransactionController {
    constructor(private readonly transactionService: TransactionService) {}

    @Post()
    async send(@Body() body:{message:string}) {
        const { message } = body;
        return this.transactionService.processMessage(message)
    }

    // @Post('add')
    // async add(@Body() body: { message: string }) {
    //     const { message } = body;
    //     if (!message || message.trim() === '') {
    //         return {
    //             status: "error",
    //             message: "Empty message",
    //             data: null,
    //         };
    //     }
    //     const [transaction, responseText] = await this.transactionService.processMessage(message);
    //     if (transaction) {
    //         await this.transactionService.addTransaction(transaction);
    //         return {
    //             status: "success",
    //             message: responseText,
    //             data: transaction,
    //         };
    //     } else {
    //         return {
    //             status: "success",
    //             message: responseText,
    //             data: null,
    //         };
    //     }
    // }

    // @Get('read')
    // async read(@Query('day') day: string, @Query('time') time: string) {
    //     if (!day || !time) {
    //         return {
    //             status: "error",
    //             message: "Vui lòng nhập cả ngày và thời gian",
    //             data: null,
    //         };
    //     }
    //     const transaction = await this.transactionService.getTransactionByDateTime(day, time);
    //     if (!transaction) {
    //         return {
    //             status: "error",
    //             message: "Không tìm thấy giao dịch",
    //             data: null,
    //         };
    //     }
    //     return {
    //         status: "success",
    //         message: "Đã tìm thấy giao dịch",
    //         data: transaction,
    //     };
    // }

    // @Get('read/all')
    // async readAll(@Query() query: any) {
    //     const transactions = await this.transactionService.getAllTransactions(query);
    //     return {
    //         status: "success",
    //         message: `Found ${transactions.length} transactions`,
    //         data: transactions,
    //     };
    // }

    // @Post('read/all')
    // async addTransaction(@Body() body: { time: string, amount: number, note: string }) {
    //     const { time, amount, note } = body;
    //     if (!time || !amount || !note) {
    //         return {
    //             status: "error",
    //             message: "Missing required fields",
    //             data: null,
    //         };
    //     }
    //     const now = new Date();
    //     const inputTime = now.toISOString();
    //     const transaction: Transaction = {
    //         inputTime,
    //         time: time,
    //         action: 'add',
    //         criteria: 'Unknown',
    //         value: amount.toString(),
    //         note: note,
    //     };
    //     await this.transactionService.addTransaction(transaction);
    //     return {
    //         status: "success",
    //         message: "Transaction added successfully",
    //         data: transaction,
    //     };
    // }

    // @Put('read/all')
    // async updateTransaction(@Body() body: any) {
    //     const inputTime = body['Thời gian ghi nhận'];
    //     if (!inputTime) {
    //         return {
    //             status: "error",
    //             message: "Missing Thời gian ghi nhận",
    //             data: null,
    //         };
    //     }
    //     const updated = await this.transactionService.updateTransaction(inputTime, body);
    //     if (!updated) {
    //         return {
    //             status: "error",
    //             message: "Transaction not found",
    //             data: null,
    //         };
    //     }
    //     return {
    //         status: "success",
    //         message: "Transaction updated successfully",
    //         data: updated,
    //     };
    // }

    // @Delete('read/all')
    // async deleteFromReadAll(@Body() body: { inputTime: string }) {
    //     const deleted = await this.transactionService.deleteTransaction(body.inputTime);
    //     if (!deleted) {
    //         return {
    //             status: "error",
    //             message: "Transaction not found",
    //             data: null,
    //         };
    //     }
    //     deleted.action = 'delete';
    //     return {
    //         status: "success",
    //         message: "Giao dịch đã được xoá thành công",
    //         data: deleted,
    //     };
    // }

    // @Delete('delete')
    // async deleteTransaction(@Query('Thời gian ghi nhận') inputTime: string) {
    //     if (inputTime === 'all') {
    //         await this.transactionService.deleteAllTransactions();
    //         return {
    //             status: "success",
    //             message: "All transactions deleted successfully",
    //             data: null,
    //         };
    //     }
    //     const deleted = await this.transactionService.deleteTransaction(inputTime);
    //     if (!deleted) {
    //         return {
    //             status: "error",
    //             message: "Transaction not found",
    //             data: null,
    //         };
    //     }
    //     return {
    //         status: "success",
    //         message: "Transaction deleted successfully",
    //         data: deleted,
    //     };
    // }

    // @Delete('delete/all')
    // async deleteAllTransactions() {
    //     await this.transactionService.deleteAllTransactions();
    //     return {
    //         status: "success",
    //         message: "Đã xoá toàn bộ giao dịch",
    //         data: null,
    //     };
    // }

    // @Put('edit')
    // async editTransaction(@Body() body: any) {
    //     const inputTime = body['Thời gian ghi nhận'];
    //     if (!inputTime) {
    //         return {
    //             status: "error",
    //             message: "Missing Thời gian ghi nhận",
    //             data: null,
    //         };
    //     }
    //     const updated = await this.transactionService.updateTransaction(inputTime, body);
    //     if (!updated) {
    //         return {
    //             status: "error",
    //             message: "Không tìm thấy giao dịch",
    //             data: null,
    //         };
    //     }
    //     return {
    //         status: "success",
    //         message: "Transaction updated successfully",
    //         data: updated,
    //     };
    // }
}
