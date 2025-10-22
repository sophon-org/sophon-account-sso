import { StyleSheet } from 'react-native';
import { Card } from './card';
import { Container, type ContainerProps } from './container';
import { Icon } from './icon';
import { Text } from './text';

interface CardErrorProps extends ContainerProps {
  text: string;
}

export function CardError({ text, ...restProps }: CardErrorProps) {
  return (
    <Container {...restProps}>
      <Card style={styles.errorCard}>
        <Container
          width={24}
          height={24}
          justifyContent="center"
          alignItems="center"
        >
          <Icon name="closeCircle" size={19.5} color="#F52109" />
        </Container>
        <Container
          flexDirection="row"
          flexShrink={1}
          minHeight={24}
          alignItems="center"
        >
          <Text fontWeight="bold" textAlign="left">
            {text}
          </Text>
        </Container>
      </Card>
    </Container>
  );
}

const styles = StyleSheet.create({
  errorCard: {
    flex: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 8,
  },
});
