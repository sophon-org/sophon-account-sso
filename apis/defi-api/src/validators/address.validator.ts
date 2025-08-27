import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { ChainValidationService } from '../services/chain-validation.service';

export function IsEthereumAddress(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isEthereumAddress',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          
          const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
          return ethereumAddressRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid Ethereum address`;
        },
      },
    });
  };
}

export function IsValidAmount(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidAmount',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          
          try {
            const amount = BigInt(value);
            return amount > 0n;
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid positive amount in wei`;
        },
      },
    });
  };
}

export function IsSupportedChain(options?: { providerIdField?: string; validationOptions?: ValidationOptions }) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSupportedChain',
      target: object.constructor,
      propertyName: propertyName,
      options: options?.validationOptions,
      constraints: [options?.providerIdField],
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'number') {
            return false;
          }

          const [providerIdField] = args.constraints;
          let providerId: string | undefined;
          
          if (providerIdField && args.object) {
            providerId = (args.object as any)[providerIdField];
          }

          try {
            const chainValidationService = global.chainValidationService as ChainValidationService;
            if (!chainValidationService) {
              return false;
            }
            
            return chainValidationService.isChainSupported(value, providerId);
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          const [providerIdField] = args.constraints;
          let providerId: string | undefined;
          
          if (providerIdField && args.object) {
            providerId = (args.object as any)[providerIdField];
          }

          try {
            const chainValidationService = global.chainValidationService as ChainValidationService;
            if (chainValidationService) {
              const validation = chainValidationService.validateChainForProvider(args.value, providerId);
              if (!validation.isValid) {
                return validation.error || `${args.property} is not a supported chain`;
              }
            }
          } catch {
            // Fallback
          }
          
          return `${args.property} must be a supported chain ID`;
        },
      },
    });
  };
}