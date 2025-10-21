import { Image, StyleSheet, View } from 'react-native';
import { Container, Text } from '../../ui';

type FooterSheetProps = {
  hideTerms?: boolean;
};

export function FooterSheet(props: FooterSheetProps) {
  return (
    <View style={styles.container}>
      <Container isVisible={!props?.hideTerms}>
        <Text color="#8D8D8D" size="small">
          {`By logging in you are accepting our\n`}
          <Text color="#0066FF" size="small">
            {' '}
            Terms of Use{' '}
          </Text>
          and
          <Text color="#0066FF" size="small">
            {' '}
            Privacy Policy
          </Text>
          .
        </Text>
      </Container>
      <View style={styles.row}>
        <Text color="#8D8D8D">Powered by</Text>
        <Image source={require('../../assets/images/sophon-logo.png')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
