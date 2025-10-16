import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useEmbeddedAuth } from '../../../auth/useAuth';
// import { useAuthSheet } from '../auth-bottom-sheet';
import { AVAILABLE_PROVIDERS } from '../../../constants';

export const SignInModal = () => {
  const emailRef = React.useRef('');
  // const { scopes } = useAuthSheet();
  const { signInWithSocialProvider, signInWithEmail } = useEmbeddedAuth();
  return (
    <View style={styles.container}>
      <View style={styles.socialRow}>
        {AVAILABLE_PROVIDERS.map((scope) => (
          <TouchableOpacity
            key={scope}
            style={styles.socialButton}
            onPress={() => signInWithSocialProvider(scope)}
          >
            <Text style={{ textTransform: 'capitalize' }}>{scope}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.emailSection}>
        <TextInput
          onChangeText={(text) => {
            emailRef.current = text;
          }}
          keyboardType="email-address"
          placeholder="Enter email"
          placeholderTextColor="#999"
          style={styles.input}
        />
        <TouchableOpacity
          style={styles.signInButtonDisabled}
          onPress={() => signInWithEmail(emailRef.current || '')}
        >
          <Text style={styles.signInTextDisabled}>Sign in</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>Alternatively</Text>
        <View style={styles.divider} />
      </View>

      <TouchableOpacity style={styles.walletButton}>
        {/* <WalletIcon size={22} color="#000" /> */}
        <Text style={styles.walletText}>Sign in with Wallet</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        {`By logging in you are accepting our\n`}
        <Text style={styles.link}> Terms of Use </Text>
        and
        <Text style={styles.link}> Privacy Policy</Text>.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 16,
  },
  socialButton: {
    width: 56,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F6F7F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#EBEBEB',
    borderWidth: 1,
  },
  emailSection: {
    marginVertical: 16,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  signInButtonDisabled: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInTextDisabled: {
    color: '#AAA',
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEE',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
  },
  walletButton: {
    backgroundColor: '#EAF1FF',
    borderRadius: 8,
    height: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  walletText: {
    color: '#0066FF',
    fontWeight: '600',
  },
  footerText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 14,
    lineHeight: 24,
  },
  link: {
    color: '#0066FF',
  },
});
