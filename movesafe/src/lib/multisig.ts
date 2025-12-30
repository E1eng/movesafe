import {
  Ed25519PublicKey,
  Ed25519Signature,
  MultiEd25519PublicKey,
  MultiEd25519Signature,
  AccountAuthenticatorMultiEd25519,
} from "@aptos-labs/ts-sdk";

export interface SignatureData {
  signer: string;
  hex: string;
}

export interface TransactionPayload {
  function: string;
  typeArguments: string[];
  functionArguments: (string | number | boolean | Uint8Array)[];
}

export function generateSafeAddress(
  owners: string[],
  threshold: number
): string {
  if (owners.length < threshold) {
    throw new Error(
      `Threshold (${threshold}) cannot exceed number of owners (${owners.length})`
    );
  }

  if (threshold < 1) {
    throw new Error("Threshold must be at least 1");
  }

  const publicKeys = owners.map((hexPubKey) => {
    const cleanHex = hexPubKey.startsWith("0x")
      ? hexPubKey.slice(2)
      : hexPubKey;
    return new Ed25519PublicKey(cleanHex);
  });

  const multiSigPublicKey = new MultiEd25519PublicKey({
    publicKeys,
    threshold,
  });

  const authKey = multiSigPublicKey.authKey();
  const safeAddress = authKey.derivedAddress();

  return safeAddress.toString();
}

export function createTransactionPayload(
  func: string,
  args: (string | number | boolean | Uint8Array)[],
  typeArgs: string[] = []
): TransactionPayload {
  return {
    function: func,
    typeArguments: typeArgs,
    functionArguments: args,
  };
}

export function assembleMultiSigAuthenticator(
  signatures: SignatureData[],
  ownerPublicKeys: string[],
  threshold: number
): AccountAuthenticatorMultiEd25519 {
  if (signatures.length === 0) {
    throw new Error("At least one signature is required");
  }

  const owners = ownerPublicKeys.map((ownerPubKey) => {
    const cleanOwnerPubKey = ownerPubKey.startsWith("0x") ? ownerPubKey.slice(2) : ownerPubKey;
    return new Ed25519PublicKey(cleanOwnerPubKey);
  });

  const multiSigPublicKey = new MultiEd25519PublicKey({
    publicKeys: owners,
    threshold,
  });

  const indexedSignatures: Array<{ index: number; sig: Ed25519Signature }> = [];

  signatures.forEach((sig) => {
    const cleanSignerAddress = sig.signer.startsWith("0x")
      ? sig.signer.slice(2)
      : sig.signer;

    const signerIndex = owners.findIndex((ownerPublicKey) => {
      const ownerAddress = ownerPublicKey.authKey().derivedAddress().toString();
      const cleanOwnerAddress = ownerAddress.startsWith("0x")
        ? ownerAddress.slice(2).toLowerCase()
        : ownerAddress.toLowerCase();

      return cleanOwnerAddress === cleanSignerAddress.toLowerCase();
    });

    if (signerIndex === -1) {
      throw new Error(
        `Signer ${sig.signer} is not found in the owners list. Cannot construct bitmap.`
      );
    }

    const cleanSignatureHex = sig.hex.startsWith("0x")
      ? sig.hex.slice(2)
      : sig.hex;

    indexedSignatures.push({
      index: signerIndex,
      sig: new Ed25519Signature(cleanSignatureHex),
    });
  });

  // Sort by signer index to satisfy bitmap requirements and ensure signatures match bitmap order
  indexedSignatures.sort((a, b) => a.index - b.index);

  const bitmapBits = indexedSignatures.map((s) => s.index);
  const ed25519Signatures = indexedSignatures.map((s) => s.sig);

  const multiSig = new MultiEd25519Signature({
    signatures: ed25519Signatures,
    bitmap: bitmapBits,
  });

  return new AccountAuthenticatorMultiEd25519(multiSigPublicKey, multiSig);
}
