import {
  AppBskyFeedPost,
  AppBskyFeedRepost,
  AppBskyFeedLike,
} from '@atproto/api';

enum FrameType {
  Message = 1,
  Error = -1,
}

type FrameHeader = { t?: string; op: FrameType };
export type Frame = [FrameHeader, object];

export type Feed<T> = {
  uri: string;
  cid: string;
  repo: string;
  value: T;
};

export interface IAppBskyFeedPost extends AppBskyFeedPost.Record {
  via?: string;
}

export interface IAppBskyFeedRepost extends AppBskyFeedRepost.Record {
  via?: string;
}

export interface IAppBskyFeedLike extends AppBskyFeedLike.Record {
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
