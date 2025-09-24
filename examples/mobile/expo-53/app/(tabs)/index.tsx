import { shortenAddress } from '@sophon-labs/account-core';
import {
  type SophonJWTToken,
  useSophonAccount,
  useSophonToken,
} from '@sophon-labs/account-react-native';
import { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { erc20Abi, parseEther, parseUnits } from 'viem';
import { sophonTestnet } from 'viem/chains';

export default function HomeScreen() {
  const { account, connect, isConnected, logout, walletClient } =
    useSophonAccount();
  const { getAccessToken } = useSophonToken();
  const [token, setToken] = useState<SophonJWTToken | null>(null);
  useEffect(() => {
    getAccessToken().then((token) => setToken(token));
  }, [getAccessToken]);

  const [error, setError] = useState<string>('');
  const [signature, setSignature] = useState<string>();
  const [typedDataSignature, setTypedDataSignature] = useState<string>();
  const [transaction, setTransaction] = useState<string>();

  return (
    <ScrollView>
      <View style={{ marginTop: 100, marginBottom: 300 }}>
        {error && (
          <View
            style={{
              backgroundColor: 'rgba(250, 82, 82, .1)',
              borderColor: 'red',
              borderRadius: 6,
              borderWidth: 1,
              margin: 16,
              padding: 8,
            }}
          >
            <Text style={{ fontWeight: 'bold', color: 'red' }}>Warning</Text>
            <Text style={{ color: 'black' }}>{error}</Text>
          </View>
        )}
        {isConnected && (
          <Text
            style={{
              color: 'white',
              borderColor: 'green',
              borderRadius: 5,
              backgroundColor: 'green',
              padding: 10,
              marginLeft: 10,
              marginRight: 10,
              marginTop: 10,
              marginBottom: 10,
              textAlign: 'center',
              fontSize: 20,
              fontWeight: 'bold',
            }}
          >
            Hello, {shortenAddress(account!.address)}, token: {`${!!token}`}
          </Text>
        )}

        {!isConnected && (
          <View style={styles.button}>
            <Button
              title={`✨ Authenticate`}
              color="white"
              onPress={() => {
                setError('');
                connect().catch((e) => setError(e.details ?? e.message));
              }}
            />
          </View>
        )}

        {isConnected && (
          <>
            <View style={styles.button}>
              <Button
                title="✍️ Sign Message"
                color="white"
                onPress={async () => {
                  try {
                    setError('');
                    const signature = await walletClient!.signMessage({
                      account: account!.address,
                      message: 'Hello from Sophon SSO!',
                    });
                    setSignature(signature);
                    // biome-ignore lint/suspicious/noExplicitAny: TODO: create better types here
                  } catch (e: any) {
                    setError(e.details ?? e.message);
                  }
                }}
              />
            </View>

            {signature && <Text>Signature: {signature ?? 'N/A'}</Text>}
          </>
        )}

        {isConnected && (
          <>
            <View style={styles.button}>
              <Button
                title="✍️ Sign Typed Data"
                color="white"
                onPress={async () => {
                  try {
                    setError('');
                    const signature = await walletClient!.signTypedData({
                      account: account!.address,
                      domain: {
                        name: 'Sophon SSO',
                        version: '1',
                        chainId: sophonTestnet.id,
                      },
                      types: {
                        Message: [
                          { name: 'content', type: 'string' },
                          { name: 'from', type: 'address' },
                          { name: 'timestamp', type: 'uint256' },
                        ],
                      },
                      primaryType: 'Message',
                      message: {
                        content: `Hello from Sophon SSO!\n\nThis message confirms you control this wallet.`,
                        from: account!.address,
                        timestamp: BigInt(Math.floor(Date.now() / 1000)),
                      },
                    });
                    setTypedDataSignature(signature);
                    // biome-ignore lint/suspicious/noExplicitAny: TODO: create better types here
                  } catch (e: any) {
                    setError(e.details ?? e.message);
                  }
                }}
              />
            </View>

            {typedDataSignature && (
              <Text>Signature: {typedDataSignature ?? 'N/A'}</Text>
            )}
          </>
        )}

        {isConnected && (
          <>
            <View style={{ ...styles.button, backgroundColor: 'blue' }}>
              <Button
                title="👑 Transaction"
                color="white"
                onPress={async () => {
                  try {
                    setError('');
                    const tx = await walletClient!.sendTransaction({
                      to: '0x0d94c4DBE58f6FE1566A7302b4E4C3cD03744626',
                      value: parseEther('0.006'),
                      data: '0x',
                      account: account!.address,
                      // biome-ignore lint/suspicious/noExplicitAny: TODO: review this
                      chain: sophonTestnet as any,
                    });
                    setTransaction(tx);
                    // biome-ignore lint/suspicious/noExplicitAny: TODO: create better types here
                  } catch (e: any) {
                    setError(e.details ?? e.message);
                  }
                }}
              />
            </View>

            {transaction && <Text>Transaction: {transaction ?? 'N/A'}</Text>}
          </>
        )}

        {isConnected && (
          <>
            <View style={{ ...styles.button, backgroundColor: 'blue' }}>
              <Button
                title="ERC20 Transaction"
                color="white"
                onPress={async () => {
                  try {
                    setError('');
                    const tx = await walletClient!.writeContract({
                      address: '0xE70a7d8563074D6510F550Ba547874C3C2a6F81F', // MOCK DAI contract
                      abi: erc20Abi,
                      functionName: 'transfer',
                      args: [
                        '0x0d94c4DBE58f6FE1566A7302b4E4C3cD03744626' as `0x${string}`,
                        parseUnits('1', 18),
                      ],
                      account: account!.address,
                      // biome-ignore lint/suspicious/noExplicitAny: TODO: review this
                      chain: sophonTestnet as any,
                    });
                    setTransaction(tx);
                    // biome-ignore lint/suspicious/noExplicitAny: TODO: create better types here
                  } catch (e: any) {
                    setError(e.details ?? e.message);
                  }
                }}
              />
            </View>

            {transaction && <Text>Transaction: {transaction ?? 'N/A'}</Text>}
          </>
        )}

        {isConnected && (
          <View style={{ ...styles.button, backgroundColor: 'red' }}>
            <Button
              title="🥹 Disconnect"
              color="white"
              onPress={() => {
                setSignature(undefined);
                setTransaction(undefined);
                setToken(null);
                logout();
              }}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    padding: 10,
    color: 'white',
    backgroundColor: 'black',
    borderRadius: 5,
    margin: 10,
  },
});
