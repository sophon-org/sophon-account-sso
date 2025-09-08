import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/button';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View>
        <Text>This screen does not exist.</Text>
        <Link href="/">
          <Button>
            <Text>Go to home screen!</Text>
          </Button>
        </Link>
      </View>
    </>
  );
}
