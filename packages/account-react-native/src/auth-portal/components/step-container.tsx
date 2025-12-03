import type { PropsWithChildren } from 'react';
import { Container, type ContainerProps } from '../../ui';

export function StepContainer(props: PropsWithChildren<ContainerProps>) {
  return <Container marginHorizontal={16} {...props} />;
}
