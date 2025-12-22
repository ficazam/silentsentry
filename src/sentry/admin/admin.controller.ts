import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { FirestoreStorage } from '../storage/firestore.storage';
import { CreateTargetSchema } from 'src/core/types';

@Controller('admin/targets')
@UseGuards(AdminGuard)
export class AdminTargetsController {
  constructor(private readonly storage: FirestoreStorage) {}

  @Get()
  async list() {
    const targets = await this.storage.listTargetsAll();
    return { targets };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const target = await this.storage.getTarget(id);
    return { target };
  }

  @Post()
  async create(@Body() body: unknown) {
    const parsed = CreateTargetSchema.safeParse(body);
    if (!parsed.success) {
      return { error: parsed.error.flatten() };
    }

    const created = await this.storage.createTarget(parsed.data);
    return { target: created };
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() body: unknown) {
    const schema = CreateTargetSchema.partial();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return { error: parsed.error.flatten() };
    }

    const updated = await this.storage.updateTarget(id, parsed.data);
    return { target: updated };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.storage.deleteTarget(id);
    return { ok: true };
  }
}
