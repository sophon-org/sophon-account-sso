import { shortenAddress } from '@sophon-labs/account-core';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '../../i18n';
import {
  Button,
  Card,
  CardError,
  Container,
  Skeleton,
  Text,
  type ThemeColorType,
  useThemedStyles,
} from '../../ui';
import { StepContainer } from '../components/step-container';
import {
  CardContractWarning,
  TransactionRequestProvider,
  useTransactionRequestContext,
  useTransactionRequestFormatter,
} from '../modules/transaction-request';
import { AddressLink } from '../modules/transaction-request/components/address-link';
import type { BasicStepProps } from '../types';

const TransactionStepComponent: React.FC<BasicStepProps> = (params) => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const {
    onViewFeeDetailsPress,
    onViewTransactionDetailsPress,
    enrichedTransactionRequest,
    transactionRequest,
    loading,
    isSophonTransaction,
    isApproveLoading,
    openExplorerAddress,
    approve,
    approveError,
    onViewErrorDetailsPress,
  } = useTransactionRequestContext();

  const {
    transactionDisplay,
    transactionTitle,
    currentToken,
    spenderParams,
    interactingWith,
    renderInteractingArgs,
  } = useTransactionRequestFormatter();

  return (
    <StepContainer>
      <Container marginBottom={24}>
        <Skeleton
          height={24}
          width={200}
          loading={loading}
          style={{ alignSelf: 'center' }}
        >
          <Text size="large" textAlign="center">
            {transactionTitle}
          </Text>
        </Skeleton>
      </Container>
      <CardContractWarning transactionRequest={enrichedTransactionRequest} />
      <Card>
        <Container style={styles.contentCard}>
          <Container isVisible={Boolean(spenderParams?.contract)}>
            <Skeleton height={20} loading={loading}>
              <Text fontWeight="bold" lineHeight={24}>
                {t('transactionStep.contract')}:
              </Text>
            </Skeleton>
            <Skeleton height={20} loading={loading}>
              <AddressLink
                isLink
                details={spenderParams?.contract}
                onPress={openExplorerAddress}
              />
            </Skeleton>
          </Container>

          {/* Transaction */}
          <Container isVisible={loading || !interactingWith}>
            <Container>
              <Skeleton height={20} loading={loading}>
                <Text fontWeight="bold" lineHeight={24}>
                  {t('transactionStep.token')}:
                </Text>
              </Skeleton>
              <Skeleton height={20} loading={loading}>
                <AddressLink
                  isLink={!isSophonTransaction}
                  details={currentToken}
                  onPress={openExplorerAddress}
                />
              </Skeleton>
            </Container>
            <Container isVisible={!spenderParams || loading}>
              <Skeleton height={20} loading={loading}>
                <Text fontWeight="bold" lineHeight={24}>
                  {t('transactionStep.to')}:
                </Text>
              </Skeleton>
              <Skeleton height={20} loading={loading}>
                <Text>{shortenAddress(transactionRequest?.to)}</Text>
              </Skeleton>
            </Container>
            <Container isVisible={!spenderParams || loading}>
              <Skeleton height={20} loading={loading}>
                <Text fontWeight="bold" lineHeight={24}>
                  {t('transactionStep.amount')}:
                </Text>
              </Skeleton>
              <Skeleton height={20} loading={loading}>
                <Text lineHeight={24}>{transactionDisplay.value}</Text>
              </Skeleton>
            </Container>
          </Container>

          {/* Contract */}
          <Container isVisible={Boolean(interactingWith)}>
            <Container>
              <Skeleton height={20} loading={loading}>
                <Text fontWeight="bold" lineHeight={24}>
                  {t('transactionStep.interactingWith')}:
                </Text>
              </Skeleton>
              <Skeleton height={20} loading={loading}>
                <AddressLink
                  isLink={isSophonTransaction}
                  details={interactingWith?.contract}
                  onPress={openExplorerAddress}
                />
              </Skeleton>
            </Container>
            {interactingWith?.data.map((item) => (
              <Container key={item.name} marginLeft={4} marginTop={4}>
                <Skeleton height={20} loading={loading}>
                  {renderInteractingArgs(item)}
                </Skeleton>
              </Container>
            ))}
          </Container>

          {/* Approve */}
          <Container isVisible={Boolean(spenderParams?.spendingCap)}>
            <Skeleton height={20} loading={loading}>
              <Text fontWeight="bold" lineHeight={24}>
                {t('transactionStep.spendingCap')}:
              </Text>
            </Skeleton>
            <Skeleton height={20} loading={loading}>
              <Text lineHeight={24}>{spenderParams?.spendingCap}</Text>
            </Skeleton>
          </Container>
          <Container isVisible={Boolean(spenderParams?.currentBalance)}>
            <Skeleton height={20} loading={loading}>
              <Text fontWeight="bold" lineHeight={24}>
                {t('transactionStep.currentBalance')}:
              </Text>
            </Skeleton>
            <Skeleton height={20} loading={loading}>
              <Text lineHeight={24}>{spenderParams?.currentBalance}</Text>
            </Skeleton>
          </Container>
        </Container>

        <TouchableOpacity
          disabled={loading}
          style={styles.viewDetailsButton}
          onPress={onViewTransactionDetailsPress}
        >
          <Skeleton
            width={200}
            height={20}
            loading={loading}
            style={{ alignSelf: 'center' }}
          >
            <Text textAlign="center">{t('transactionStep.viewDetails')}</Text>
          </Skeleton>
        </TouchableOpacity>
      </Card>
      <Container isVisible={!!approveError}>
        <TouchableOpacity
          onPress={() => onViewErrorDetailsPress(approveError!)}
        >
          <CardError
            isVisible
            text={t('transactionStep.errorDetailButton')}
            marginVertical={8}
          />
        </TouchableOpacity>
      </Container>
      <Container isVisible={!approveError}>
        <TouchableOpacity onPress={onViewFeeDetailsPress}>
          <Card style={[styles.contentCard, styles.feeCard]}>
            <Container>
              <Text fontWeight="bold">{t('transactionStep.estimatedFee')}</Text>
            </Container>
            <Container alignItems="flex-end" flexWrap="wrap">
              <Skeleton height={20} loading={loading}>
                <Text textAlign="right" fontWeight="bold" ellipsizeMode="tail">
                  {transactionDisplay.feeSOPH}
                </Text>
              </Skeleton>
              <Skeleton height={20} loading={loading}>
                <Text textAlign="right">{transactionDisplay.feeUSD}</Text>
              </Skeleton>
            </Container>
          </Card>
        </TouchableOpacity>
      </Container>
      <Container style={styles.buttons}>
        <Button
          containerStyle={styles.buttonWrapper}
          text={t('common.cancel')}
          variant="secondary"
          disabled={loading || isApproveLoading}
          onPress={params.onCancel}
        />
        <Button
          containerStyle={styles.buttonWrapper}
          text={t('common.approve')}
          disabled={loading || isApproveLoading}
          loading={isApproveLoading}
          onPress={approve}
        />
      </Container>
    </StepContainer>
  );
};

export function TransactionStep(props: BasicStepProps) {
  return (
    <TransactionRequestProvider>
      <TransactionStepComponent {...props} />
    </TransactionRequestProvider>
  );
}

const createStyles = (colors: ThemeColorType) =>
  StyleSheet.create({
    buttonWrapper: {
      flex: 1,
    },
    viewDetailsButton: {
      padding: 16,
      backgroundColor: colors.background.primary,
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      margin: 1,
    },
    contentCard: {
      gap: 24,
      padding: 16,
      marginVertical: 16,
    },
    feeCard: {
      marginTop: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    buttons: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
      marginVertical: 16,
    },
  });
