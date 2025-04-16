import { Injectable, Logger } from '@nestjs/common';
// import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from 'openai';
import {
  GenerativeModel,
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import * as dotenv from 'dotenv';
import { DateTime } from "luxon";
import Transaction from 'src/type/transaction';

interface BotResponse{

}

dotenv.config();

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private AIgen: GoogleGenerativeAI;
  private client: GenerativeModel;
  private vietnameseChars: Set<string> = new Set(
    "ăâđêôơưàảãạáằẳẵặắầẩẫậấèẻẽẹéềểễệếìỉĩịíòỏõọóồổỗộốờởỡợớùủũụúừửữựứỳỷỹỵý"
  );
  private systemPrompt: string |undefined= process.env.SYSTEM_PROMPT;

  constructor() {
    const apiKey=process.env.AI_API_KEY;

    this.AIgen = new GoogleGenerativeAI(apiKey ? apiKey  : "");
    const modelGenConfig = {
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2000,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ]
    };
    let model: GenerativeModel | undefined;
    try {
      model = this.AIgen.getGenerativeModel({ model: "gemini-1.5-pro-latest", ...modelGenConfig });
      if (!model) model = this.AIgen.getGenerativeModel({ model: "gemini-1.5-pro", ...modelGenConfig });
      if (!model) model = this.AIgen.getGenerativeModel({ model: "gemini-1.5", ...modelGenConfig });
    } catch (error) {
      this.logger.error(`Lỗi khi lấy mô hình: ${error}`);
    }
    if(model) this.client = model
    else this.logger.error("Không thể lấy mô hình AI.");
  }  
  /**
   * Phương thức kiểm tra tiếng Việt (dựa trên một số ký tự đặc trưng)
   */
  public detectLanguage(text: string): 'vi' | 'non-vi' {
    const hasVietnamese = [...text.toLowerCase()].some(char =>
      this.vietnameseChars.has(char)
    );

    return hasVietnamese ? 'vi' : 'non-vi';
  }
  

  /**
   * Dịch tin nhắn sang tiếng Việt bằng cách gọi API OpenAI.
   */
  public async translateMessage(text: string): Promise<string> {
    try {
      const result = await this.client.generateContent(`Translate this to Vietnamese: ${text}`);
      const rawText= await result.response.text(); // Or adjust based on actual SDK structure
      let responseText: string = rawText.trim();
      return responseText;
    } catch (error) {
      console.error(`Translation error: ${error}`);
      return text;
    }
  }

  /**
   * Xử lý tin nhắn:
   * - Nếu tin nhắn không phải tiếng Việt, dịch tin nhắn và trả về phản hồi dạng: "translated_text".
   * - Nếu là tiếng Việt, build prompt với SYSTEM_PROMPT và gửi tới OpenAI.
   * Sau đó xử lý kết quả trả về (ví dụ: nếu chứa các lệnh /add, /delete, ... thì trích xuất thông tin giao dịch).
   *
   * Trả về tuple gồm: [transactionInfo (nếu có), responseText]
   */
  public async processMessage(message: string): Promise<[Transaction | null, string, number, string]> {
    try {
      let translatedMessage = message;
      let type = -1;
      let cmd = "";
      // if (this.detectLanguage(message) !== "vi") {
      //   //translatedMessage = await this.translateMessage(message);
      // }
  
      const fullPrompt = `
  ${this.systemPrompt}
  
  Phân tích tin nhắn sau đây:
  "${message}"
      `;
  
      const result = await this.client.generateContent(fullPrompt);
      let responseText: string = await result.response.text();
      console.log("Response from AI:", responseText);
      responseText = responseText.trim().replace(/\\n/g, "\n");
  
      if (responseText.includes("Xin lỗi, tôi chỉ hỗ trợ quản lý chi tiêu")) {
        return [null, "Xin lỗi, tôi chỉ hỗ trợ quản lý chi tiêu", -1, ""];
      }
  
      // --- Tách các phần trong phản hồi ---
      const lines = responseText.split("\n").map(line => line.trim()).filter(Boolean);
  
      const classifyLine = lines.find(line => line.startsWith("Phân loại:")) || "";
      const commandLine = lines.find(line => line.startsWith("/add") || line.startsWith("/read") || line.startsWith("/edit") || line.startsWith("/delete")) || "";
      const replyLine = lines.find(line => line.startsWith("Trả lời người dùng:")) || "";


      if (classifyLine.includes("loại 1")) return [null, replyLine.replace("Trả lời người dùng:", "").trim(), 0, ""];
  
      // --- Xác định type ---
      if (commandLine.startsWith("/add")) type = 1;
      else if (commandLine.startsWith("/read")) type = 2;
      else if (commandLine.startsWith("/edit")) type = 3;
      else if (commandLine.startsWith("/delete")) type = 4;
  
      cmd = commandLine;
  
      let responseToUser = replyLine ? replyLine.replace("Trả lời người dùng:", "").trim() : "";
  
      // --- Nếu có lệnh thì trích xuất transaction ---
      let transaction: Transaction | null = null;
      if (type > 0 && cmd) {
        const now = DateTime.now();
        transaction = {
          "Thời gian ghi nhận": now.toFormat("dd/MM/yyyy HH:mm:ss"),
          "Thời gian giao dịch": now.toFormat("dd/MM/yyyy"),
          "Số tiền": "0",
          "Ghi chú": "Không rõ",
          "Danh mục": "Other",
        };
  
        const patterns: { [key: string]: RegExp } = {
          value: /\[value:\s*([+-]?\d+)\]/,
          time: /\[Time:\s*([^\]]+)\]/,
          note: /\[note:\s*([^\]]+)\]/,
          criteria: /\[criteria:\s*([^\]]+)\]/,
        };
  
        for (const field in patterns) {
          const match = cmd.match(patterns[field]);
          if (match) {
            const value = match[1].trim();
            if (field === "value") {
              transaction["Số tiền"] = value;
            } else if (field === "time") {
              const timeValue = value.toLowerCase();
              if (timeValue.includes("hôm qua") || timeValue.includes("qua")) {
                const yesterday = now.minus({ days: 1 });
                transaction["Thời gian giao dịch"] = yesterday.toFormat("dd/MM/yyyy");
              } else if (["now", "nay", "vừa"].some(x => timeValue.includes(x))) {
                transaction["Thời gian giao dịch"] = now.toFormat("dd/MM/yyyy");
              } else if (!["sáng", "trưa", "chiều", "tối"].some(x => timeValue.includes(x))) {
                transaction["Thời gian giao dịch"] = value;
              }
            } else if (field === "note") {
              transaction["Ghi chú"] = value;
            } else if (field === "criteria") {
              transaction["Danh mục"] = value;
            }
          }
        }
      }
  
      return [transaction, responseToUser, type, cmd];
    } catch (error) {
      console.error(`[Lỗi xử lý]: ${error}`);
      return [null, `Đã xảy ra lỗi khi xử lý tin nhắn. Chi tiết: ${error}`, -1, ""];
    }
  }
  
}
