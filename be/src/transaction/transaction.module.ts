import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { AIModule } from 'src/ai/ai.module';

@Module({
    imports: [AIModule],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}
