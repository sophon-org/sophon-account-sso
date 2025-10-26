import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from 'expo-web-browser';
import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from '../../i18n';
import { Container, Text } from '../../ui';

type FooterSheetProps = {
  hideTerms?: boolean;
};

export function FooterSheet(props: FooterSheetProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Container isVisible={!props?.hideTerms}>
        <Text color="#8D8D8D" size="small" textAlign="center">
          {t('footer.byContinuing')}
          <Text
            onPress={() =>
              openBrowserAsync('https://sophon.xyz/terms', {
                presentationStyle: WebBrowserPresentationStyle.POPOVER,
              })
            }
            color="#0066FF"
            size="small"
          >
            {' '}
            {t('common.termsOfUse')}{' '}
          </Text>
          {t('common.and')}
          <Text
            onPress={() =>
              openBrowserAsync('https://sophon.xyz/privacypolicy', {
                presentationStyle: WebBrowserPresentationStyle.PAGE_SHEET,
              })
            }
            color="#0066FF"
            size="small"
          >
            {' '}
            {t('common.privacyPolicy')}
          </Text>
          .
        </Text>
      </Container>
      <View style={styles.row}>
        <Text color="#8D8D8D">{t('common.poweredBy')}</Text>
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
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
