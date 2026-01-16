import { Injectable, NotFoundException } from '@nestjs/common';
import { Note } from './note.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class NotesService {
  private notes: Note[] = [];

  create(ownerId: string, title: string, content: string) {
    const now = new Date().toISOString();
    const note: Note = {
      id: randomUUID(),
      ownerId,
      title,
      content,
      createdAt: now,
      updatedAt: now,
    };
    this.notes.push(note);
    return note;
  }

  listForUser(ownerId: string) {
    return this.notes.filter((n) => n.ownerId === ownerId);
  }

  findOne(ownerId: string, id: string) {
    const note = this.notes.find((n) => n.ownerId === ownerId && n.id === id);
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  update(ownerId: string, id: string, patch: Partial<Note>) {
    const note = this.findOne(ownerId, id);
    Object.assign(note, patch, { updatedAt: new Date().toISOString() });
    return note;
  }
}
