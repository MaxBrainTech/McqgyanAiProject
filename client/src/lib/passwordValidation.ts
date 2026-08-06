// client/src/lib/passwordValidation.ts

const SPECIAL_CHARACTER_REGEX = /[!@#$%^&*(),.?":{}|<>]/;

export interface PasswordValidationResult {
  minLength: boolean;
  specialCharacter: boolean;
}

export function getPasswordValidation(
  password: string
): PasswordValidationResult {
  return {
    minLength: password.length >= 8,
    specialCharacter: SPECIAL_CHARACTER_REGEX.test(password),
  };
}

export function validatePassword(password: string) {
  const validation = getPasswordValidation(password);

  return {
    valid: validation.minLength && validation.specialCharacter,
    validation,
  };
}