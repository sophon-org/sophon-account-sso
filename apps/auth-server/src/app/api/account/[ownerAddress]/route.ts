import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { Address, isAddress } from "viem";
import { deployAccount } from "@/lib/account";

const DATABASE_PATH = path.join(process.cwd(), "database.json");
console.log("database path", DATABASE_PATH);
if (!fs.existsSync(DATABASE_PATH)) {
  fs.writeFileSync(DATABASE_PATH, JSON.stringify({}));
}

type DatabaseSchema = {
  address: Address;
  owners: Address[];
}[];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ownerAddress: Address }> }
) {
  const ownerAddress = (await params).ownerAddress?.toLowerCase() as Address;
  if (!isAddress(ownerAddress)) {
    return NextResponse.json(
      { message: `Invalid address: ${ownerAddress}` },
      { status: 400 }
    );
  }

  const database = JSON.parse(
    fs.readFileSync(DATABASE_PATH, "utf8")
  ) as DatabaseSchema;
  const signerOf = database.filter((sa) => sa.owners.includes(ownerAddress));

  return NextResponse.json(
    { accounts: signerOf.map((sm) => sm.address) },
    { status: 200 }
  );
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ ownerAddress: Address }> }
) {
  const ownerAddress = (await params).ownerAddress?.toLowerCase() as Address;
  if (!isAddress(ownerAddress)) {
    return NextResponse.json(
      { message: `Invalid address: ${ownerAddress}` },
      { status: 400 }
    );
  }

  const database = JSON.parse(
    fs.readFileSync(DATABASE_PATH, "utf8")
  ) as DatabaseSchema;
  const signerOf = database.filter((sa) => sa.owners.includes(ownerAddress));
  if (signerOf.length > 0) {
    return NextResponse.json(
      { message: `Account already exists: ${ownerAddress}` },
      { status: 400 }
    );
  }

  const deployed = await deployAccount(ownerAddress);
  console.log("🔥 Account deployed", deployed.address);

  database.push({ address: deployed.address, owners: [ownerAddress] });
  fs.writeFileSync(DATABASE_PATH, JSON.stringify(database, null, 2));

  return NextResponse.json({ accounts: [deployed.address] }, { status: 200 });
}
