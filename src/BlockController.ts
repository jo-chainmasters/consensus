import { Controller, Get, Param } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('blocks')
export class BlockController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get(':height')
  public async getBlockData(@Param() params: any) {
    const blockHeight = params.height;
    if (!blockHeight) {
      throw new Error('unknown block');
    }
    const collection = this.connection.collection('consensus');
    const block = await collection.findOne({
      height: Number(blockHeight),
    });
    return block;
  }
}
