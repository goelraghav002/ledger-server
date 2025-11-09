import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsE164(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isE164',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          // basic E.164 check: + followed by 8-15 digits
          return /^\+\d{8,15}$/.test(value);
        },
        defaultMessage() {
          return '$property must be a valid E.164 phone number (e.g. +911234567890)';
        },
      },
    });
  };
}