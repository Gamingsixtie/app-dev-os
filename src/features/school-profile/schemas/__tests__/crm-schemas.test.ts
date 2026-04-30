import { describe, it, expect } from 'vitest';
import { contactSchema, type ContactFormData } from '../contact.schema';
import { conversationSchema, type ConversationFormData } from '../conversation.schema';
import { actionSchema, type ActionFormData } from '../action.schema';

describe('contactSchema', () => {
  it('validates a complete contact', () => {
    const data: ContactFormData = {
      name: 'Jan de Vries',
      dmuPosition: 'gebruiker',
      jobTitle: 'Toetscoordinator',
      email: 'jan@school.nl',
      phone: '06-12345678',
      preferredChannel: 'email',
      authority: 'adviserend',
      notes: 'Eerste contact',
      isPrimary: true,
    };
    const result = contactSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('requires name with min 1 character', () => {
    const result = contactSchema.safeParse({ name: '', dmuPosition: 'gebruiker' });
    expect(result.success).toBe(false);
  });

  it('requires dmuPosition', () => {
    const result = contactSchema.safeParse({ name: 'Test' });
    expect(result.success).toBe(false);
  });

  it('validates email format when provided', () => {
    const result = contactSchema.safeParse({
      name: 'Test',
      dmuPosition: 'beslisser',
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('allows empty email', () => {
    const result = contactSchema.safeParse({
      name: 'Test',
      dmuPosition: 'beslisser',
      email: '',
    });
    expect(result.success).toBe(true);
  });

  it('applies defaults for optional fields', () => {
    const result = contactSchema.safeParse({
      name: 'Test',
      dmuPosition: 'inkoper',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.preferredChannel).toBe('email');
      expect(result.data.authority).toBe('adviserend');
      expect(result.data.isPrimary).toBe(false);
    }
  });
});

describe('conversationSchema', () => {
  it('validates a complete conversation', () => {
    const data: ConversationFormData = {
      date: '2026-03-15',
      contactId: 'contact-1',
      content: 'Gesprek over producten',
      tags: ['prijs', 'demo'],
    };
    const result = conversationSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('requires date', () => {
    const result = conversationSchema.safeParse({
      contactId: 'contact-1',
      content: 'Inhoud',
    });
    expect(result.success).toBe(false);
  });

  it('requires contactId', () => {
    const result = conversationSchema.safeParse({
      date: '2026-03-15',
      content: 'Inhoud',
    });
    expect(result.success).toBe(false);
  });

  it('requires content with min 1 character', () => {
    const result = conversationSchema.safeParse({
      date: '2026-03-15',
      contactId: 'contact-1',
      content: '',
    });
    expect(result.success).toBe(false);
  });

  it('defaults tags to empty array', () => {
    const result = conversationSchema.safeParse({
      date: '2026-03-15',
      contactId: 'contact-1',
      content: 'Inhoud',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
    }
  });
});

describe('actionSchema', () => {
  it('validates a complete action', () => {
    const data: ActionFormData = {
      title: 'Offerte sturen',
      status: 'todo',
      conversationId: 'conv-1',
      type: null,
      dueDate: null,
    };
    const result = actionSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('requires title with min 1 character', () => {
    const result = actionSchema.safeParse({ title: '', status: 'todo' });
    expect(result.success).toBe(false);
  });

  it('validates status enum', () => {
    const result = actionSchema.safeParse({ title: 'Test', status: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('defaults status to todo', () => {
    const result = actionSchema.safeParse({ title: 'Test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('todo');
    }
  });

  it('defaults conversationId to null', () => {
    const result = actionSchema.safeParse({ title: 'Test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.conversationId).toBeNull();
    }
  });
});
