import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import '../auth/types';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateNoteDto) {
    const userId = req.jwtPayload?.sub || '';
    return this.notesService.create(userId, dto.title, dto.content);
  }

  @Get()
  list(@Req() req: Request) {
    const userId = req.jwtPayload?.sub || '';
    return this.notesService.listForUser(userId);
  }

  @Get(':id')
  get(@Req() req: Request, @Param('id') id: string) {
    const userId = req.jwtPayload?.sub || '';
    return this.notesService.findOne(userId, id);
  }

  @Patch(':id')
  patch(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateNoteDto) {
    const userId = req.jwtPayload?.sub || '';
    return this.notesService.update(userId, id, dto as any);
  }
}
