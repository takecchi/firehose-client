import * as cborx from 'cbor-x';
import { CID } from 'multiformats/cid';
import * as cborCodec from '@ipld/dag-cbor';

cborx.addExtension({
  Class: CID,
  tag: 42,
  encode: () => {
    throw new Error('cannot encode cids');
  },
  decode: (bytes: Uint8Array): CID => {
    if (bytes[0] !== 0) {
      throw new Error('Invalid CID for CBOR tag 42; expected leading 0x00');
    }
    return CID.decode(bytes.subarray(1)); // ignore leading 0x00
  },
});

export const cborDecodeMulti = (encoded: Uint8Array): unknown[] => {
  const decoded: unknown[] = [];
  cborx.decodeMultiple(encoded, (value) => {
    decoded.push(value);
  });
  return decoded;
};

export const cborDecode = cborCodec.decode;
