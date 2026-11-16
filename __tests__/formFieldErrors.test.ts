import {
  getChangePasswordFormErrors,
  WRONG_CURRENT_PASSWORD_MESSAGE,
} from '@/features/auth/utils/passwordErrors';
import { getFormErrors } from '@/lib/errors';

const validationError = (details: { field: string; message: string }[]) => ({
  isAxiosError: true,
  response: {
    status: 400,
    data: { code: 'VALIDATION_ERROR', message: 'Validation failed', details },
  },
});

const wrongPassword = {
  isAxiosError: true,
  response: { status: 400, data: { code: 'INVALID_PASSWORD', message: 'x' } },
};

describe('getChangePasswordFormErrors', () => {
  it('maps details[] to the matching inputs', () => {
    const { fields, general } = getChangePasswordFormErrors(
      validationError([{ field: 'newPassword', message: 'Demasiado corta' }]),
    );
    expect(fields).toEqual({ newPassword: 'Demasiado corta' });
    expect(general).toBeNull();
  });

  it('sends unknown fields to general', () => {
    const { fields, general } = getChangePasswordFormErrors(
      validationError([{ field: 'other', message: 'Nope' }]),
    );
    expect(fields).toEqual({});
    expect(general).toBe('Nope');
  });

  it('keeps the wrong-current-password heuristic for non-validation errors', () => {
    const { fields, general } = getChangePasswordFormErrors(wrongPassword);
    expect(fields).toEqual({});
    expect(general).toBe(WRONG_CURRENT_PASSWORD_MESSAGE);
  });
});

describe('getFormErrors for the other forms', () => {
  it.each([
    ['login', ['email', 'password'] as const, 'email'],
    ['edit profile', ['firstName', 'lastName', 'phone', 'bio'] as const, 'phone'],
    ['service form', ['title', 'description', 'price'] as const, 'price'],
    ['reset password', ['newPassword'] as const, 'newPassword'],
  ])('%s: known field lands on its input, unknown on general', (_n, known, field) => {
    const { fields, general } = getFormErrors(
      validationError([
        { field, message: 'Campo inválido' },
        { field: 'mystery', message: 'Extra' },
      ]),
      known as readonly string[],
    );
    expect(fields[field as never]).toBe('Campo inválido');
    expect(general).toBe('Extra');
  });
});
