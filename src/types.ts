import {
  AppBskyFeedPost,
  AppBskyFeedRepost,
  AppBskyFeedLike,
  AppBskyGraphFollow,
  AppBskyGraphBlock,
  AppBskyActorProfile,
  AppBskyFeedThreadgate,
} from '@atproto/api';

enum FrameType {
  Message = 1,
  Error = -1,
}

type FrameHeader = { t?: string; op: FrameType };
export type Frame = [FrameHeader, object];

export type Event<T> = {
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

export interface IAppBskyGraphFollow extends AppBskyGraphFollow.Record {
  via?: string;
}

export interface IAppBskyGraphBlock extends AppBskyGraphBlock.Record {
  via?: string;
}

export interface IAppBskyActorProfile extends AppBskyActorProfile.Record {
  via?: string;
}

export interface IAppBskyFeedThreadgate extends AppBskyFeedThreadgate.Record {
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

export function isAppBskyGraphFollow(v: unknown): v is IAppBskyGraphFollow {
  return AppBskyGraphFollow.isRecord(v);
}

export function isAppBskyGraphBlock(v: unknown): v is IAppBskyGraphBlock {
  return AppBskyGraphBlock.isRecord(v);
}

export function isAppBskyActorProfile(v: unknown): v is IAppBskyActorProfile {
  return AppBskyActorProfile.isRecord(v);
}

export function isAppBskyFeedThreadgate(
  v: unknown,
): v is IAppBskyFeedThreadgate {
  return AppBskyFeedThreadgate.isRecord(v);
}
