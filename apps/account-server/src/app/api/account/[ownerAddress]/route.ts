import { type NextRequest, NextResponse } from 'next/server';
import { type Address, isAddress } from 'viem';
import { deployAccount } from '@/lib/account';
import { hyperindexService } from '@/service/hyperindex.service';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ ownerAddress: Address }> },
) {
  const ownerAddress = (await params).ownerAddress?.toLowerCase() as Address;
  if (!isAddress(ownerAddress)) {
    return NextResponse.json(
      { message: `Invalid address: ${ownerAddress}` },
      { status: 400 },
    );
  }

  // TODO: here we need to check if the account is deployed or not, not if the user is a signer
  const accounts = await hyperindexService.getOwnedSmartAccounts(ownerAddress);
  if (accounts.length > 0) {
    return NextResponse.json(
      { message: `Account already exists: ${ownerAddress}` },
      { status: 400 },
    );
  }

  const deployed = await deployAccount(ownerAddress);
  return NextResponse.json({ accounts: [deployed.address] }, { status: 200 });
}
