import { randomUUID } from 'node:crypto';

export class ValidationError extends Error {
  constructor(message = 'Invalid message input') {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

export class PermissionError extends Error {
  constructor(message = 'Permission denied') {
    super(message);
    this.name = 'PermissionError';
    this.status = 403;
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Message not found') {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function defaultClock() {
  const now = new Date();
  return [
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  ].join(' ');
}

function requireUserid(currentUser) {
  const userid = typeof currentUser?.userid === 'string' ? currentUser.userid.trim() : '';
  if (!userid) {
    throw new PermissionError('Current user is required');
  }
  return userid;
}

function validateText(value, fieldName) {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} is required`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new ValidationError(`${fieldName} is required`);
  }

  return normalized;
}

function validateMessageInput(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('message input is required');
  }

  const title = validateText(input.title, 'title');
  const content = validateText(input.content, 'content');

  if (title.length > 200) {
    throw new ValidationError('title must be at most 200 characters');
  }

  return { title, content };
}

function assertCreator(row, userid) {
  if (row.creatorUserid !== userid) {
    throw new PermissionError('Only the creator can modify this message');
  }
}

export function createMessageService({ repository, idFactory = randomUUID, clock = defaultClock } = {}) {
  if (!repository) {
    throw new TypeError('repository is required');
  }

  async function isReady() {
    return typeof repository.tableExists === 'function' ? repository.tableExists() : true;
  }

  async function list(filters = {}) {
    return repository.list(filters);
  }

  async function findById(id) {
    const row = await repository.findById(id);
    if (!row) {
      throw new NotFoundError();
    }
    return row;
  }

  async function create(input, currentUser) {
    const userid = requireUserid(currentUser);
    const { title, content } = validateMessageInput(input);
    return repository.insert({
      id: idFactory(),
      title,
      content,
      creatorUserid: userid,
      now: clock()
    });
  }

  async function update(id, input, currentUser) {
    const userid = requireUserid(currentUser);
    const row = await findById(id);
    assertCreator(row, userid);
    const { title, content } = validateMessageInput(input);
    return repository.update({
      id,
      title,
      content,
      now: clock()
    });
  }

  async function deleteMessage(id, currentUser) {
    const userid = requireUserid(currentUser);
    const row = await findById(id);
    assertCreator(row, userid);
    const deleted = await repository.delete(id);
    if (!deleted) {
      throw new NotFoundError();
    }
    return true;
  }

  async function deleteMany(ids, currentUser) {
    if (!Array.isArray(ids)) {
      throw new ValidationError('ids must be an array');
    }

    const results = [];
    for (const id of ids) {
      results.push(await deleteMessage(id, currentUser));
    }
    return results;
  }

  return {
    isReady,
    list,
    findById,
    create,
    update,
    delete: deleteMessage,
    deleteMany
  };
}
