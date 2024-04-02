import {
  AppBskyFeedPost,
  AppBskyFeedRepost,
  AppBskyFeedLike,
} from '@atproto/api';
import { CID } from 'multiformats/cid';

enum FrameType {
  Message = 1,
  Error = -1,
}

type FrameHeader = { t?: string; op: FrameType };
export type Frame = [FrameHeader, object];

export interface ICommit {
  // The repo this event comes from.
  repo: string;
}

export interface IAppBskyFeedPost extends AppBskyFeedPost.Record {
  cid: CID;
  uri: string;
  via?: string;
}

export interface IAppBskyFeedRepost extends AppBskyFeedRepost.Record {
  cid: CID;
  uri: string;
  via?: string;
}

export interface IAppBskyFeedLike extends AppBskyFeedLike.Record {
  cid: CID;
  uri: string;
  via?: string;
}

export function isAppBskyFeedPost(v: unknown): v is IAppBskyFeedPost {
  return AppBskyFeedPost.isRecord(v);
}

export function isAppBskyFeedRepost(v: unknown): v is IAppBskyFeedRepost {
  return AppBskyFeedRepost.isRecord(v);
}

export function isAppBskyFeedLike(v: unknown): v is IAppBskyFeedLike {
  return AppBskyFeedLike.isRecord(v);
}
