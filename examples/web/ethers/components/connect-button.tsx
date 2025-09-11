import { sophonTestnet } from 'viem/chains';
import { useConfig } from 'wagmi';
import { connect, getConnectors, signMessage } from 'wagmi/actions';

export const ConnectButton = () => {
  const wagmiConfig = useConfig();
  const handleConnect = async () => {
    const connectors = getConnectors(wagmiConfig);
    const connector = connectors.find(
      (provider) => provider.id === `xyz.sophon.staging.my`,
    );

    if (!connector) {
      throw new Error('Connector not found');
    }

    console.log('Connecting to Sophon');
    await connect(wagmiConfig, {
      chainId: sophonTestnet.id,
      connector: connector,
    });

    // await 1 second
    // await new Promise((resolve) => setTimeout(resolve, 100));

    console.log('Connected to Sophon, signing message');
    const msgString = `Message to sign`;
    const signature = await signMessage(wagmiConfig, {
      message: msgString,
    });
    console.log(`Signature: ${signature}`);
    const signature2 = await signMessage(wagmiConfig, {
      message: `Message to sign2`,
    });
    console.log(`Signature2: ${signature2}`);
  };

  return (
    <button
      className="bg-green-500/30 text-black border border-green-500/50 px-4 py-2 rounded-md hover:bg-green-500/50 transition-all duration-300 hover:cursor-pointer"
      type="button"
      onClick={handleConnect}
    >
      Connect With Sophon
    </button>
  );
};
