from flask import Flask, request, jsonify
import google.generativeai as genai
from datetime import datetime, timedelta
import re
from typing import Dict, Optional, Tuple, List
from datetime import datetime

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False
app.json.ensure_ascii = False

# Config
genai.configure(api_key="AIzaSyB623sY3_eMQwVmWKB6hYzfk4uYEEhHKVg")
GEMINI_API_KEY = "AIzaSyB623sY3_eMQwVmWKB6hYzfk4uYEEhHKVg"
try:
    model = genai.GenerativeModel('gemini-1.5-pro-latest')
except:
    try:
        model = genai.GenerativeModel('gemini-1.0-pro-latest') 
    except:
        try:
            model = genai.GenerativeModel('gemini-pro')
        except Exception as e:
            print(f"Không thể khởi tạo model: {str(e)}")
            raise

SYSTEM_PROMPT = """
Bạn là một chatbot quản lý chi tiêu thông minh, được thiết kế để giúp người dùng theo dõi, lưu trữ và phân tích các giao dịch tài chính cá nhân. Nhiệm vụ của bạn được chia thành 2 phần chính:

1. Chat:
   - Hỗ trợ trả lời các câu hỏi liên quan đến quản lý tài chính, tư vấn và đưa ra lời khuyên phù hợp.
   - Nếu tin nhắn không liên quan đến quản lý chi tiêu, hãy trả lời: "Xin lỗi, tôi chỉ hỗ trợ quản lý chi tiêu và tài chính cá nhân."
   - Nếu tin nhắn không phải tiếng Việt, bạn cần:
       • Tin nhắn thứ nhất: trả lời bằng bản dịch tiếng Việt của tin nhắn gốc, được đặt trong dấu ngoặc kép (ví dụ: "Hello" -> "Xin chào").
       • Tin nhắn thứ hai: trả lời tin nhắn của người dùng bằng tiếng Việt dựa trên nội dung sau khi đã dịch.
   - Trả lời một cách tự nhiên, súc tích và chính xác, đưa ra những lời khuyên cụ thể và hữu ích cho quản lý chi tiêu.

2. Xếp loại tin nhắn người dùng:
   - Phân loại tin nhắn thành 2 loại:
       a. Tin nhắn giao tiếp bình thường: Những tin nhắn không liên quan đến lưu trữ giao dịch vào database, ví dụ:
          • "Nếu tôi dùng 500k thì tôi còn bao nhiêu?"
          • "Tôi muốn mua xe thì tôi cần tiết kiệm bao nhiêu?"
          • "Giả sử tôi có 100k làm sao để chi tiêu cho 3 bữa ăn"
          • "Tôi sẽ cố gắng tiếp kiệm 100k"
       b. Tin nhắn cần phân loại và lưu trữ vào database: Những tin nhắn chứa thông tin giao dịch hoặc yêu cầu truy vấn dữ liệu, ví dụ:
          • "1tr tiền lương", "hôm nay ăn bún hết 50k", "mua áo hết 500000"
          • "Số dư hiện tại của tôi là bao nhiêu?", "tháng 3 tôi tiêu hết bao nhiêu?", "Tiền ăn tháng này", "Tiền lương năm nay"
   - Với các tin nhắn cần lưu trữ, phân tích nội dung tin nhắn thành các thao tác CRUD:
       • **add:** Thêm vào một transaction mới.
             Cấu trúc: 
             /add [inputTime] [Time: dd/mm/yyyy] [value: số tiền (dương hoặc âm)] [note: mô tả ngắn] [criteria: tiêu chí phân loại]
       • **delete:** Xóa giao dịch dựa trên inputTime.
             Cấu trúc:
             /delete [inputTime]
       • **edit:** Chỉnh sửa giao dịch dựa trên inputTime và dữ liệu cần cập nhật.
             Cấu trúc:
             /edit [inputTime] [data: các field cần sửa]
       • **read:** Truy xuất giao dịch dựa trên tham số truy vấn, có thể là thời gian (ngày, tháng, năm), criteria, hoặc loại giá trị (income, spend, balance).
             Cấu trúc:
             /read [params]
- API response cần đảm bảo có cấu trúc sau (tất cả các giá trị trong "data" đều ở dạng chuỗi):
     {
       "status": "",       // "success" hoặc "error"
       "message": "",      // Mô tả kết quả
       "data": {           // Các trường bên dưới đều ở dạng chuỗi
          "inputTime": "dd/mm/yyyy",
          "time": "dd/mm/yyyy",
          "action": "",    // add, delete, read, edit
          "criteria": "",  // Có thể là null nếu không xác định
          "value": "",     // Số tiền (dương hoặc âm)
          "note": ""
       }
     }

- Quy tắc xử lý giao dịch từ tin nhắn:
   • Nếu tin nhắn chứa thông tin số tiền và mô tả giao dịch, hãy trích xuất:
         - Số tiền: Dương (thu nhập) hoặc âm (chi tiêu).
         - Thời gian giao dịch: Nếu không có, mặc định là "now".
         - Note: Mô tả ngắn gọn.
         - Criteria: Phân loại giao dịch dựa trên nội dung "note" với danh sách tiêu chí sau:
           1. Thu nhập: lương, lì xì, thưởng, làm thêm, trợ cấp, mẹ cho tiền, bán đồ...
           2. Ăn uống: ăn sáng, ăn trưa, ăn tối, cà phê, trà sữa, bánh kẹo...
           3. Mua sắm: mua quần áo, giày dép, mỹ phẩm, phụ kiện...
           4. Di chuyển: xăng, vé xe, taxi, grab...
           5. Giải trí: xem phim, chơi game, du lịch, mua sách...
           6. Hóa đơn: điện, nước, internet, thuê nhà, bảo hiểm...
           7. Giáo dục: học phí, sách vở, khóa học, hội thảo...
           8. Chăm sóc sức khỏe: khám bệnh, thuốc, bảo hiểm y tế...
           9. Khác: các giao dịch không thuộc các danh mục trên.
          10. Không rõ nguồn gốc: Nếu tin nhắn không có thông tin mô tả cụ thể (ví dụ: "1tr", "-20k").
   • Nếu tin nhắn không phù hợp với các tiêu chí lưu trữ (ví dụ: chỉ hỏi thông tin, gợi ý mục tiêu, hay giả định), hãy chỉ trả lời và không lưu trữ.

Ví dụ:
- "Hôm nay nhận lương 1tr" 
  → Phân loại: Chat + lưu trữ (add)
  /add [inputTime: now] [Time: hôm nay] [value: 1000000] [note: lương] [criteria: Income]
  
- "Vừa ăn trưa hết 50k"
  → Phân loại: Chat + lưu trữ (add)
  /add [inputTime: now] [Time: vừa ăn trưa] [value: -50000] [note: ăn trưa] [criteria: Food & Drinks]
  
- "Tôi muốn mua xe thì tôi cần tiết kiệm bao nhiêu?"
  → Phân loại: Chat (chỉ trả lời, không lưu trữ)

- "500k"
  → Phân loại: Chat + lưu trữ (add)
  /add [inputTime: now] [Time: now] [value: 500000] [note: không rõ] [criteria: không rõ nguồn gốc]
"""

# Memory database
transactions_db = {}

def detect_language(text: str) -> str:
    """Simple language detection (focus on Vietnamese vs non-Vietnamese)"""
    vietnamese_chars = set("ăâđêôơưàảãạáằẳẵặắầẩẫậấèẻẽẹéềểễệếìỉĩịíòỏõọóồổỗộốờởỡợớùủũụúừửữựứỳỷỹỵý")
    has_vietnamese = any(char in vietnamese_chars for char in text.lower())
    return 'vi' if has_vietnamese else 'non-vi'

def translate_message(text: str) -> str:
    """Translate non-Vietnamese message to Vietnamese using Gemini"""
    try:
        response = model.generate_content(f"Translate this to Vietnamese: {text}")
        return response.text
    except Exception as e:
        print(f"Translation error: {e}")
        return text

def     process_message(message: str) -> Tuple[Optional[Dict], str]:
    try:
        if detect_language(message) != 'vi':
            translated = translate_message(message)
            return None, f'"{translated}"'

        full_prompt = f"""
        {SYSTEM_PROMPT}
        
        Phân tích tin nhắn sau đây:
        "{message}"
        """

        response = model.generate_content(
            full_prompt,
            generation_config={
                "temperature": 0.3,
                "max_output_tokens": 2000,
            },
            safety_settings={
                "HARM_CATEGORY_HARASSMENT": "BLOCK_NONE",
                "HARM_CATEGORY_HATE_SPEECH": "BLOCK_NONE",
                "HARM_CATEGORY_SEXUALLY_EXPLICIT": "BLOCK_NONE", 
                "HARM_CATEGORY_DANGEROUS_CONTENT": "BLOCK_NONE"
            }
        )
        
        response_text = response.text.strip()
        if response_text.startswith("Phân loại: Chat (chỉ trả lời, không lưu trữ)"):
            response_text = response_text.split("\n\n", 1)[1] if "\n\n" in response_text else response_text
        
        if response_text.startswith("Trả lời người dùng:"):
            response_text = response_text.replace("Trả lời người dùng:", "", 1).strip()
        
        response_text = response_text.replace("\\n", "\n")
        response_text = response_text.strip()

        if "Xin lỗi, tôi chỉ hỗ trợ quản lý chi tiêu" in response_text:
            return None, response_text

        transaction_info = None
        if any(cmd in response_text for cmd in ['/add', '/delete', '/edit', '/read']):
            current_date = datetime.now()
            transaction_info = {
                "Thời gian ghi nhận": current_date.strftime('%d/%m/%Y %H:%M:%S'),
                "Thời gian": current_date.strftime('%d/%m/%Y'),
                "Số tiền": "0",
                "Ghi chú": "Không rõ",
                "Danh mục": "Other",
            }

            patterns = {
                'value': r'\[value:\s*([+-]?\d+)\]',
                'time': r'\[Time:\s*([^\]]+)\]',
                'note': r'\[note:\s*([^\]]+)\]',
                'criteria': r'\[criteria:\s*([^\]]+)\]'
            }

            for field, pattern in patterns.items():
                match = re.search(pattern, response_text)
                if match:
                    value = match.group(1).strip()
                    if field == 'value':
                        transaction_info["Số tiền"] = value
                    elif field == 'time':
                        time_value = value.lower()
                        if any(x in time_value for x in ['hôm qua', 'qua']):
                            yesterday = current_date - timedelta(days=1)
                            transaction_info["Thời gian"] = yesterday.strftime('%d/%m/%Y')
                        elif time_value == 'now' or 'nay' in time_value or 'vừa' in time_value:
                            transaction_info["Thời gian"] = current_date.strftime('%d/%m/%Y')
                        elif not any(x in time_value for x in ['sáng', 'trưa', 'chiều', 'tối']):
                            transaction_info["Thời gian"] = value
                    elif field == 'note':
                        transaction_info["Ghi chú"] = value
                    elif field == 'criteria':
                        transaction_info["Danh mục"] = value

            response_text = f"Đã ghi nhận giao dịch: {transaction_info['Ghi chú']} {transaction_info['Số tiền']}VND"

        return transaction_info, response_text

    except Exception as e:
        print(f"[Lỗi xử lý]: {str(e)}")
        return None, f"Đã xảy ra lỗi khi xử lý tin nhắn. Chi tiết: {str(e)}"

@app.route('/')
def home():
    return "Truy cập /add để bắt đầu."

@app.route('/add', methods=['GET', 'POST'])
def add():
    if request.method == 'GET':
        return '''
            <form method="POST" action="/add">
                <input type="text" name="message" placeholder="Nhập tin nhắn của bạn...">
                <input type="submit" value="Gửi">
            </form>
        '''
        
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form
    message = data.get('message', '').strip()
    
    if not message:
        return jsonify({
            "status": "error",
            "message": "Empty message",
            "data": None
        })
    
    db_action, response = process_message(message)
    
    if db_action:
        input_time = db_action['Thời gian ghi nhận']
        transactions_db[input_time] = db_action
        
        return jsonify({
            "status": "success",
            "message": response,
            "data": db_action
        })
    else:
        return jsonify({
            "status": "success",
            "message": response,
            "data": None
        })

@app.route('/read', methods=['GET', 'POST'])
def read_transaction():
    if request.method == 'GET':
        return '''
            <form method="POST" action="/read">
                <label>Ngày (dd/mm/yyyy):</label><br>
                <input type="text" name="day" placeholder="Ví dụ: 25/12/2023" style="width: 300px;"><br><br>
                <label>Thời gian (hh:mm:ss):</label><br>
                <input type="text" name="time" placeholder="Ví dụ: 14:30:00" style="width: 300px;"><br><br>
                <input type="submit" value="Tìm kiếm">
            </form>
        '''
    
    # Handle POST method
    day = request.form.get('day', '').strip()
    time = request.form.get('time', '').strip()
    
    if not day or not time:
        return jsonify({
            "status": "error",
            "message": "Vui lòng nhập cả ngày và thời gian",
            "data": None
        })
    
    # Validate day format
    try:
        datetime.strptime(day, '%d/%m/%Y')
    except ValueError:
        return jsonify({
            "status": "error",
            "message": "Định dạng ngày không hợp lệ (dd/mm/yyyy)",
            "data": None
        })
    
    # Validate time format
    try:
        time_parts = time.split(':')
        if len(time_parts) != 3:
            raise ValueError
        
        hours = int(time_parts[0])
        minutes = int(time_parts[1])
        seconds = int(time_parts[2])
        
        if not (0 <= hours <= 23 and 0 <= minutes <= 59 and 0 <= seconds <= 59):
            raise ValueError
    except ValueError:
        return jsonify({
            "status": "error",
            "message": "Định dạng thời gian không hợp lệ (hh:mm:ss)",
            "data": None
        })
    
    # Combine day and time
    search_time = f"{day} {time}"
    
    # Search for transaction
    if search_time not in transactions_db:
        return jsonify({
            "status": "error",
            "message": "Không tìm thấy giao dịch",
            "data": None
        })
    
    transaction = transactions_db[search_time]
    return jsonify({
        "status": "success",
        "message": "Đã tìm thấy giao dịch",
        "data": transaction
    })

@app.route('/read/all', methods=['GET', 'POST', 'PUT', 'DELETE'])
def read_all_transactions():
    if request.method == 'GET':
        params = request.args
        filtered_transactions = []
        
        for transaction in transactions_db.values():
            match = True
            if 'month' in params and transaction['Thời gian'].split('/')[1] != params['month']:
                match = False
            if 'year' in params and transaction['Thời gian'].split('/')[2] != params['year']:
                match = False
            if 'type' in params:
                amount = float(transaction['Số tiền'])
                if params['type'] == 'income' and amount <= 0:
                    match = False
                if params['type'] == 'spend' and amount >= 0:
                    match = False
            
            if match:
                filtered_transactions.append(transaction)
        
        return jsonify({
            "status": "success",
            "message": f"Found {len(filtered_transactions)} transactions",
            "data": filtered_transactions
        })
    
    elif request.method == 'POST':
        #Add new transaction
        data = request.json
        required_fields = ['Thời gian', 'Số tiền', 'Ghi chú']
        
        if not all(field in data for field in required_fields):
            return jsonify({
                "status": "error",
                "message": "Missing required fields",
                "data": None
            })
        
        input_time = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
        transaction = {
            "Thời gian ghi nhận": input_time,
            "Thời gian": data['Thời gian'],
            "Số tiền": str(data['Số tiền']),
            "Ghi chú": data['Ghi chú'],
        }
        
        transactions_db[input_time] = transaction
        
        return jsonify({
            "status": "success",
            "message": "Transaction added successfully",
            "data": transaction
        })
    
    elif request.method == 'PUT':
        #Edit transaction
        data = request.json
        input_time = data.get('Thời gian ghi nhận')
        
        if not input_time or input_time not in transactions_db:
            return jsonify({
                "status": "error",
                "message": "Transaction not found",
                "data": None
            })
        
        transaction = transactions_db[input_time]
        for field in ['Thời gian', 'Số tiền', 'Ghi chú']:
            if field in data:
                transaction[field] = str(data[field])
        
        transactions_db[input_time] = transaction
        
        return jsonify({
            "status": "success",
            "message": "Transaction updated successfully",
            "data": transaction
        })
    
    elif request.method == 'DELETE':
        #Delete transaction
        input_time = request.json.get("inputTime")
        
        if not input_time or input_time not in transactions_db:
            return jsonify({
                "status": "error",
                "message": "Không tìm thấy giao dịch",
                "data": None
            })
        
        deleted_transaction = transactions_db.pop(input_time)
        deleted_transaction['Phân loại'] = 'Sử dụng'
        
        return jsonify({
            "status": "success",
            "message": "Giao dịch đã được xoá thành công",
            "data": deleted_transaction
        })

@app.route('/delete', methods=['GET', 'POST', 'DELETE'])
def delete_transaction():
    if request.method == 'GET':
        return '''
            <form method="POST" action="/delete">
                <input type="text" name="Thời gian ghi nhận" placeholder="Nhập vào thời gian hoặc 'all'" style="width: 300px;">
                <input type="submit" value="Delete">
            </form>
        '''
    
    if request.method == 'POST':
        input_time = request.form.get('Thời gian ghi nhận')
    else:
        input_time = request.args.get('Thời gian ghi nhận')
    
    if input_time == 'all':
        transactions_db.clear()
        return jsonify({
            "status": "success",
            "message": "All transactions deleted successfully",
            "data": None
        })
    
    if not input_time or input_time not in transactions_db:
        return jsonify({
            "status": "error",
            "message": "Transaction not found",
            "data": None
        })
    
    deleted_transaction = transactions_db.pop(input_time)
    
    return jsonify({
        "status": "success",
        "message": "Transaction deleted successfully",
        "data": deleted_transaction
    })

@app.route('/delete/all', methods=['GET', 'POST', 'DELETE'])
def delete_all_transactions():
    transactions_db.clear()
    return jsonify({
        "status": "success",
        "message": "Đã xoá toàn bộ giao dịch",
        "data": None
    })

@app.route('/edit', methods=['GET', 'POST', 'PUT'])
def edit_transaction():
    if request.method == 'GET':
        return '''
            <form method="POST" action="/edit">
                <label>Ngày (dd/mm/yyyy):</label><br>
                <input type="text" name="day" placeholder="Ví dụ: 25/12/2023" style="width: 300px;"><br><br>
                <label>Thời gian (hh:mm:ss):</label><br>
                <input type="text" name="time" placeholder="Ví dụ: 14:30:00" style="width: 300px;"><br><br>
                <input type="submit" value="Tìm kiếm">
            </form>
        '''
    
    if request.method == 'POST':
        input_time = request.form.get('Thời gian ghi nhận')
        
        if not input_time or input_time not in transactions_db:
            return jsonify({
                "status": "error",
                "message": "Không tìm thấy giao dịch",
                "data": None
            })
        
        transaction = transactions_db[input_time]
        return f'''
            <form method="PUT" action="/edit">
                <input type="hidden" name="Thời gian ghi nhận" value="{input_time}">
                <label>Thời gian ghi nhận: {input_time}</label><br><br>
                <label>Thời gian:</label>
                <input type="text" name="Thời gian" value="{transaction['Thời gian']}" style="width: 300px;"><br><br>
                <label>Số tiền:</label>
                <input type="text" name="Số tiền" value="{transaction['Số tiền']}" style="width: 300px;"><br><br>
                <label>Ghi chú:</label>
                <input type="text" name="Ghi chú" value="{transaction['Ghi chú']}" style="width: 300px;"><br><br>
                <label>Phân loại:</label>
            </form>
        '''
    
    if request.method == 'PUT':
        data = request.form if request.form else request.json
        input_time = data.get('Thời gian ghi nhận')
        
        if not input_time or input_time not in transactions_db:
            return jsonify({
                "status": "error",
                "message": "Không tìm thấy giao dịch",
                "data": None
            })
        
        transaction = transactions_db[input_time]
        
        if 'Thời gian' in data:
            transaction['Thời gian'] = data['Thời gian']
        if 'Số tiền' in data:
            transaction['Số tiền'] = str(data['Số tiền'])
        if 'Ghi chú' in data:
            transaction['Ghi chú'] = data['Ghi chú']
        
        transactions_db[input_time] = transaction
        
        return jsonify({
            "status": "success",
            "message": "Transaction updated successfully",
            "data": transaction
        })


if __name__ == '__main__':
    app.run(debug=True)
