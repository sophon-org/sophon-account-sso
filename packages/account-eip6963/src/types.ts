import type { EIP1193Provider } from '@sophon-labs/account-provider';

/**
 * The EIP-6963 provider info according to the specification.
 *
 * @see https://eips.ethereum.org/EIPS/eip-6963
 */
export interface EIP6963ProviderInfo {
  /**
   * The unique identifier of the wallet provider.
   */
  uuid: string;

  /**
   * The name of the wallet provider.
   */
  name: string;

  /**
   * The icon of the wallet provider. According to the specification, it should be an URI pointing to an image.
   *
   * The image SHOULD be a square with 96x96px minimum resolution. See the Images/Icons below for further requirements of this property.
   */
  icon: string;

  /**
   * The rDNS of the wallet provider.
   */
  rdns: string;
}

/**
 * The EIP-6963 provider detail according to the specification.
 *
 * @see https://eips.ethereum.org/EIPS/eip-6963
 */
export interface EIP6963ProviderDetail {
  /**
   * General information about the wallet provider.
   */
  info: EIP6963ProviderInfo;

  /**
   * The actual provider implementation.
   */
  provider: EIP1193Provider;
}
