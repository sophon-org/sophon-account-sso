import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { TransactionType } from '../types/common.types';
import {
  IsEthereumAddress,
  IsSupportedChain,
  IsValidAmount,
} from '../validators/address.validator';

export class PrepareTransactionDto {
  @ApiProperty({ description: 'Transaction type', enum: TransactionType })
  @IsEnum(TransactionType)
  actionType: TransactionType;

  @ApiProperty({ description: 'Sender wallet address' })
  @IsEthereumAddress()
  sender: string;

  @ApiProperty({ description: 'Source blockchain ID' })
  @IsSupportedChain({ providerIdField: 'provider' })
  @Type(() => Number)
  sourceChain: number;

  @ApiProperty({ description: 'Destination blockchain ID' })
  @IsSupportedChain({ providerIdField: 'provider' })
  @Type(() => Number)
  destinationChain: number;

  @ApiProperty({ description: 'Source token address' })
  @IsEthereumAddress()
  sourceToken: string;

  @ApiProperty({ description: 'Destination token address' })
  @IsEthereumAddress()
  destinationToken: string;

  @ApiProperty({ description: 'Amount in wei (as string)' })
  @IsValidAmount()
  amount: string;

  @ApiProperty({ description: 'Slippage tolerance (0.1-50)' })
  @IsNumber()
  @Min(0.1)
  @Max(50)
  @Type(() => Number)
  slippage: number;

  @ApiPropertyOptional({
    description: 'Recipient address (defaults to sender)',
  })
  @IsOptional()
  @IsEthereumAddress()
  recipient?: string;

  @ApiPropertyOptional({ description: 'Preferred provider ID' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ description: 'Paymaster address for gas abstraction' })
  @IsOptional()
  @IsEthereumAddress()
  paymaster?: string;

  @ApiPropertyOptional({ description: 'Encoded paymaster input' })
  @IsOptional()
  @IsString()
  paymasterInput?: string;

  @ApiPropertyOptional({ description: 'Transaction deadline timestamp' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  deadline?: number;

  @ApiPropertyOptional({ description: 'Gas limit override' })
  @IsOptional()
  @IsString()
  gasLimit?: string;
}

export class GetStatusDto {
  @ApiProperty({ description: 'Transaction hash' })
  @IsString()
  txHash: string;

  @ApiPropertyOptional({ description: 'Source chain ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sourceChainId?: number;

  @ApiPropertyOptional({ description: 'Provider ID' })
  @IsOptional()
  @IsString()
  provider?: string;
}
