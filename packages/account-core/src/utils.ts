export const isValidPartner = async (
  partnerId: string,
  sandboxDisabled: boolean,
) => {
  if (!partnerId) {
    return false;
  }

  const baseDns = sandboxDisabled ? 'cdn.sophon.xyz' : 'cdn.staging.sophon.xyz';

  try {
    const url = `https://${baseDns}/partners/sdk/${partnerId}.json`;
    const response = await fetch(url);
    return response.ok;
  } catch (error) {
    console.error('Error fetching partner', error);
    return false;
  }
};
