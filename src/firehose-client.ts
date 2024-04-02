import WebSocket from 'ws';
import { AtpBaseClient, ComAtprotoSyncSubscribeRepos } from '@atproto/api';
import {
  Event,
  Frame,
  IAppBskyActorProfile,
  IAppBskyFeedLike,
  IAppBskyFeedPost,
  IAppBskyFeedRepost,
  IAppBskyFeedThreadgate,
  IAppBskyGraphBlock,
  IAppBskyGraphFollow,
  isAppBskyActorProfile,
  isAppBskyFeedLike,
  isAppBskyFeedPost,
  isAppBskyFeedRepost,
  isAppBskyFeedThreadgate,
  isAppBskyGraphBlock,
  isAppBskyGraphFollow,
} from './types';
import { EventEmitter } from 'events';
import { CarReader } from '@ipld/car';
import { cborDecode, cborDecodeMulti } from './utils';

const NSID = 'com.atproto.sync.subscribeRepos';
const isCommit = ComAtprotoSyncSubscribeRepos.isCommit;
type Commit = ComAtprotoSyncSubscribeRepos.Commit;

type FirehoseClientOptions = {
  host: string;
};

export class FirehoseClient extends EventEmitter {
  private ws?: WebSocket;
  private baseClient = new AtpBaseClient();

  constructor(
    private options: FirehoseClientOptions = { host: 'bsky.network' },
  ) {
    super();
  }

  public connect() {
    this.ws = new WebSocket(`wss://${this.options.host}/xrpc/${NSID}`);
    this.ws.on('message', (data) => void this.handleMessage(data));
    this.ws.on('error', (err) => this.handleError(err));
    this.ws.on('close', (code, reason) => this.handleClose(code, reason));
  }

  public close() {
    this.ws?.close();
    this.ws = undefined;
  }

  /**
   * クローズイベント
   * @param event
   * @param listener
   */
  public on(
    event: 'close',
    listener: (code: number, reason: Buffer) => void,
  ): this;

  /**
   * エラーイベント
   * @param event
   * @param listener
   */
  public on(event: 'error', listener: (error: Error) => void): this;

  /**
   * ポストイベント
   * @param event
   * @param listener
   */
  public on(
    event: 'AppBskyFeedPost',
    listener: (post: Event<IAppBskyFeedPost>) => void,
  ): this;

  /**
   * リポストイベント
   * @param event
   * @param listener
   */
  public on(
    event: 'AppBskyFeedRepost',
    listener: (repost: Event<IAppBskyFeedRepost>) => void,
  ): this;

  /**
   * ライクイベント
   * @param event
   * @param listener
   */
  public on(
    event: 'AppBskyFeedLike',
    listener: (like: Event<IAppBskyFeedLike>) => void,
  ): this;

  /**
   * フォローイベント
   * @param event
   * @param listener
   */
  public on(
    event: 'AppBskyGraphFollow',
    listener: (follow: Event<IAppBskyGraphFollow>) => void,
  ): this;

  /**
   * ブロックイベント
   * @param event
   * @param listener
   */
  public on(
    event: 'AppBskyGraphBlock',
    listener: (block: Event<IAppBskyGraphBlock>) => void,
  ): this;

  /**
   * プロフィールイベント
   * @param event
   * @param listener
   */
  public on(
    event: 'AppBskyActorProfile',
    listener: (profile: Event<IAppBskyActorProfile>) => void,
  ): this;

  /**
   * スレッドゲートイベント
   * @param event
   * @param listener
   */
  public on(
    event: 'AppBskyFeedThreadgate',
    listener: (threadgate: Event<IAppBskyFeedThreadgate>) => void,
  ): this;

  public on(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  private handleError(error: Error | string) {
    this.emit('error', new Error(error.toString()));
    this.close();
  }

  private handleClose(code: number | undefined, reason: Buffer) {
    this.emit('close', code, reason);
    this.close();
  }

  /**
   * WebSocketメッセージを処理する
   * @param data
   * @private
   */
  private async handleMessage(data: WebSocket.RawData) {
    if (data instanceof Buffer) {
      const [header, payload] = cborDecodeMulti(data) as Frame;
      if (header.t) {
        const message = this.baseClient.xrpc.lex.assertValidXrpcMessage(NSID, {
          $type: `${NSID}${header.t}`,
          ...payload,
        });
        if (isCommit(message)) {
          await this.handleCommit(message);
        } else {
          // TODO Commit以外のメッセージはどうするか
          // console.debug('Not supported message type:', message);
        }
      } else {
        // FIXME どういう時にここに入るかわからない
        // console.error('Error message received');
      }
    }
  }

  /**
   * Commitメッセージを処理する
   * @param commit
   * @private
   */
  private async handleCommit(commit: Commit) {
    for (const op of commit.ops) {
      if (op.action === 'create') {
        const cr = await CarReader.fromBytes(commit.blocks);
        if (op.cid) {
          const block = await cr.get(op.cid);
          if (block) {
            const payload = cborDecode(block.bytes);
            const feed: Event<any> = {
              cid: op.cid.toString(),
              uri: `at://${commit.repo}/${op.path}`,
              repo: commit.repo,
              value: payload,
            };
            if (isAppBskyFeedPost(payload)) {
              this.emit('AppBskyFeedPost', feed);
            } else if (isAppBskyFeedRepost(payload)) {
              this.emit('AppBskyFeedRepost', feed);
            } else if (isAppBskyFeedLike(payload)) {
              this.emit('AppBskyFeedLike', feed);
            } else if (isAppBskyGraphFollow(payload)) {
              this.emit('AppBskyGraphFollow', feed);
            } else if (isAppBskyGraphBlock(payload)) {
              this.emit('AppBskyGraphBlock', feed);
            } else if (isAppBskyActorProfile(payload)) {
              this.emit('AppBskyActorProfile', feed);
            } else if (isAppBskyFeedThreadgate(payload)) {
              this.emit('AppBskyFeedThreadgate', feed);
            } else {
              // TODO 他の型の処理をどうするか
              // console.debug('Not supported payload type:', feed);
            }
          }
        }
      } else {
        // TODO create以外のアクションはどうするか
        // console.debug('Not supported action:', op.action);
      }
    }
  }
}
