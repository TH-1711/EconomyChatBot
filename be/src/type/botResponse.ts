import Transaction from "src/type/transaction";
type botResponse={
    status: string;
    message:string;
    botMessage:string;
    type: number;
    data: Transaction | null;
}
export default botResponse;