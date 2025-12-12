import { useMemo } from 'react';
import { useTranslation } from '../../../../i18n';
import {
  type EnrichedTransactionRequest,
  TransactionType,
} from '../../../../types/transaction-request';
import { Card, Container, Icon, Text, useThemeColors } from '../../../../ui';

export function CardContractWarning({
  transactionRequest,
}: {
  transactionRequest: EnrichedTransactionRequest | null;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const warningProps = useMemo(() => {
    if (
      transactionRequest?.transactionType === TransactionType.CONTRACT &&
      transactionRequest?.isVerified
    ) {
      return null;
    }

    if (transactionRequest?.transactionType === TransactionType.APPROVE) {
      return {
        iconName: 'infoCircle' as const,
        iconColor: colors.gray[300],
        message: t('transactionStep.contractWarning.approve'),
      };
    }

    if (transactionRequest?.transactionType === TransactionType.CONTRACT) {
      if (transactionRequest?.decodedData?.args?.length)
        return {
          iconName: 'warningCircleIcon' as const,
          iconColor: colors.destructive[500],
          message: t('transactionStep.contractWarning.contract'),
        };
      else
        return {
          iconName: 'warningCircleIcon' as const,
          iconColor: colors.destructive[500],
          message: t('transactionStep.contractWarning.contractNotVerified'),
        };
    }

    return null;
  }, [transactionRequest, colors, t]);

  if (!transactionRequest || !warningProps) return null;
  return (
    <Container marginBottom={16}>
      <Card>
        <Container
          flexDirection="row"
          padding={16}
          flex={1}
          alignItems="center"
        >
          <Icon
            name={warningProps?.iconName}
            color={warningProps?.iconColor}
            size={20}
          />
          <Container marginLeft={16} flex={1}>
            <Text size="caption">{warningProps?.message}</Text>
          </Container>
        </Container>
      </Card>
    </Container>
  );
}
