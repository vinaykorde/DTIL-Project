import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateStudentEntry
} from '../src/server/adminStudentServer.js';
import {
  generateStrongPassword,
  validateStudent,
  checkBatchInternalDuplicates
} from '../src/services/studentCreationService.js';

describe('Student Account Creation Validation Suite', () => {
  it('should validate complete and correct student account data', () => {
    const student = {
      name: 'Aditya Joshi',
      studentId: 'STU-2024-002',
      email: 'aditya.joshi@hostel.com',
      password: 'StrongPassword123!'
    };

    const serverVal = validateStudentEntry(student);
    assert.strictEqual(serverVal.valid, true, 'Server validator should pass valid student');

    const clientVal = validateStudent(student);
    assert.strictEqual(clientVal.valid, true, 'Client validator should pass valid student');
    assert.strictEqual(clientVal.errors.length, 0);
  });

  it('should reject missing full name', () => {
    const student = {
      name: '   ',
      studentId: 'STU-2024-002',
      email: 'test@hostel.com',
      password: 'StrongPassword123!'
    };

    const serverVal = validateStudentEntry(student);
    assert.strictEqual(serverVal.valid, false);
    assert.match(serverVal.error, /name is required/i);

    const clientVal = validateStudent(student);
    assert.strictEqual(clientVal.valid, false);
  });

  it('should reject missing student ID', () => {
    const student = {
      name: 'Priya Patel',
      studentId: '',
      email: 'priya@hostel.com',
      password: 'StrongPassword123!'
    };

    const serverVal = validateStudentEntry(student);
    assert.strictEqual(serverVal.valid, false);
    assert.match(serverVal.error, /student id/i);
  });

  it('should reject invalid email format', () => {
    const student = {
      name: 'Rohan Mehra',
      studentId: 'STU-2024-005',
      email: 'rohan-invalid-email',
      password: 'StrongPassword123!'
    };

    const serverVal = validateStudentEntry(student);
    assert.strictEqual(serverVal.valid, false);
    assert.match(serverVal.error, /invalid email/i);

    const clientVal = validateStudent(student);
    assert.strictEqual(clientVal.valid, false);
  });

  it('should reject passwords shorter than 6 characters', () => {
    const student = {
      name: 'Karan Verma',
      studentId: 'STU-2024-006',
      email: 'karan@hostel.com',
      password: '123'
    };

    const serverVal = validateStudentEntry(student);
    assert.strictEqual(serverVal.valid, false);
    assert.match(serverVal.error, /at least 6 characters/i);

    const clientVal = validateStudent(student);
    assert.strictEqual(clientVal.valid, false);
  });

  it('should generate strong passwords meeting length and diversity criteria', () => {
    for (let i = 0; i < 10; i++) {
      const pass = generateStrongPassword();
      assert.ok(pass.length >= 8, 'Generated password must be at least 8 chars long');
      assert.ok(/[a-z]/.test(pass), 'Must contain lowercase');
      assert.ok(/[A-Z]/.test(pass), 'Must contain uppercase');
      assert.ok(/[0-9]/.test(pass), 'Must contain digit');
      assert.ok(/[!@#$%&*]/.test(pass), 'Must contain special char');
    }
  });

  it('should catch internal duplicate emails in batch submission', () => {
    const batch = [
      { name: 'Student 1', studentId: 'STU-001', email: 'dup@hostel.com', password: 'Password123!' },
      { name: 'Student 2', studentId: 'STU-002', email: 'dup@hostel.com', password: 'Password123!' }
    ];

    const dupCheck = checkBatchInternalDuplicates(batch);
    assert.strictEqual(dupCheck.hasDuplicates, true);
    assert.match(dupCheck.duplicateDetails[0], /dup@hostel.com/);
  });

  it('should catch internal duplicate student IDs in batch submission', () => {
    const batch = [
      { name: 'Student 1', studentId: 'STU-SAME', email: 'stu1@hostel.com', password: 'Password123!' },
      { name: 'Student 2', studentId: 'STU-SAME', email: 'stu2@hostel.com', password: 'Password123!' }
    ];

    const dupCheck = checkBatchInternalDuplicates(batch);
    assert.strictEqual(dupCheck.hasDuplicates, true);
    assert.match(dupCheck.duplicateDetails[0], /STU-SAME/);
  });
});
