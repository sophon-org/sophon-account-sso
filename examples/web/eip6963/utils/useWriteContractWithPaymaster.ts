import { getGeneralPaymasterInput } from 'viem/zksync';
import { useWriteContract } from 'wagmi';
import { usePaymaster } from '../components/paymaster.provider';

export function useWriteContractWithPaymaster() {
  const { writeContract, ...rest } = useWriteContract();
  const { paymasterEnabled } = usePaymaster();

  // biome-ignore lint/suspicious/noExplicitAny: update to the proper type in the future
  const writeContractWithPaymaster = async (args: any) => {
    if (paymasterEnabled) {
      // Add paymaster data to transaction
      const paymasterConfig = {
        ...args,
        paymaster: '0x98546B226dbbA8230cf620635a1e4ab01F6A99B2',
        paymasterInput: getGeneralPaymasterInput({
          innerInput: '0x',
        }),
      };
      return writeContract(paymasterConfig);
    }
    return writeContract(args);
  };

  return {
    writeContract: writeContractWithPaymaster,
    ...rest,
  };
}
