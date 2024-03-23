import WebSocket from 'ws';
import { AtpBaseClient, ComAtprotoSyncSubscribeRepos } from '@atproto/api';
import {
  Frame,
  IAppBskyFeedLike,
  IAppBskyFeedPost,
  IAppBskyFeedRepost,
  ICommit,
  isAppBskyFeedLike,
  isAppBskyFeedPost,
  isAppBskyFeedRepost,
} from './types';
import { EventEmitter } from 'events';
import { CarReader } from '@ipld/car';
import { cborDecode, cborDecodeMulti } from './utils';
import { CID } from 'multiformats/cid';

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
    event: 'create:AppBskyFeedPost',
    listener: (commit: ICommit, post: IAppBskyFeedPost) => void,
  ): this;

  /**
   * リポストイベント
   * @param event
   * @param listener
   */
  public on(
    event: 'create:AppBskyFeedRepost',
    listener: (commit: ICommit, repost: IAppBskyFeedRepost) => void,
  ): this;

  /**
   * ライクイベント
   * @param event
   * @param listener
   */
  public on(
    event: 'create:AppBskyFeedLike',
    listener: (commit: ICommit, like: IAppBskyFeedLike) => void,
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
    const arg: ICommit = { repo: commit.repo };
    for (const op of commit.ops) {
      if (op.action === 'create') {
        const cr = await CarReader.fromBytes(commit.blocks);
        if (op.cid) {
          const block = await cr.get(op.cid);
          if (block) {
            const payload = cborDecode(block.bytes);
            // CIDを追加
            (payload as { cid: CID }).cid = op.cid;
            if (isAppBskyFeedPost(payload)) {
              this.emit(
                'create:AppBskyFeedPost',
                arg,
                payload as IAppBskyFeedPost,
              );
            } else if (isAppBskyFeedRepost(payload)) {
              this.emit(
                'create:AppBskyFeedRepost',
                arg,
                payload as IAppBskyFeedRepost,
              );
            } else if (isAppBskyFeedLike(payload)) {
              this.emit(
                'create:AppBskyFeedLike',
                arg,
                payload as IAppBskyFeedLike,
              );
            } else {
              // TODO 他の型の処理をどうするか
              // console.debug('Not supported payload type:', payload);
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
