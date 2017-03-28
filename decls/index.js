// @flow
/* eslint-disable */

declare type Api = {
  next: Progresser,
  finish: Progresser,
  back: Back,
  save: SaveRestore,
  restore: SaveRestore,
  restart: Restart,
  throw: ThrowError,
  takeEvery: TakeHelperProgresser,
  takeLatest: TakeHelperProgresser,
  throttle: ThrottleHelperProgresser,
};

declare type ApiWithEffectsTesters = Api & {
  actionChannel: EffectTester,
  apply: EffectTester,
  call: EffectTester,
  cancel: EffectTester,
  cancelled: EffectTester,
  cps: EffectTester,
  flush: EffectTester,
  fork: EffectTester,
  join: EffectTester,
  parallel: EffectTester,
  put: EffectTester,
  race: EffectTester,
  select: EffectTester,
  spawn: EffectTester,
  take: EffectTester,
  takem: EffectTester,
  takeEveryFork: EffectTester,
  takeLatestFork: EffectTester,
  throttleFork: EffectTester,
  takeEveryEffect: EffectTester,
  takeLatestEffect: EffectTester,
  throttleEffect: EffectTester,
  is: EffectTester,
  inspect: EffectTester,
  isDone: EffectTester,
  returns: EffectTester,
};

declare type SavePoints = { [key: string]: Array<HistoryItem> };

declare type Progresser = (...args: Array<any>) => ApiWithEffectsTesters;
declare type Back = (n?: number) => Api;
declare type SaveRestore = (s: string) => Api;
declare type Restart = () => Api;
declare type ThrowError = (error: Error) => ApiWithEffectsTesters;

declare type TakeHelperProgresser = (
  pattern: TakePattern,
  saga: Function,
  ...args: Array<mixed>
) => Api;

declare type ThrottleHelperProgresser = (
  delayTime: number,
  pattern: TakePattern,
  saga: Function,
  ...args: Array<mixed>
) => Api;

declare type HistoryTypeArgument = 'ARGUMENT';
declare type HistoryTypeError = 'ERROR';
declare type HistoryTypeNone = 'NONE';
declare type HistoryTypeFinish = 'FINISH';
declare type HistoryTypeFinishArgument = 'FINISH_ARGUMENT';

declare type HistoryItemArgument = {
  type: HistoryTypeArgument,
  value: any,
};

declare type HistoryItemError = {
  type: HistoryTypeError,
  value: any,
};

declare type HistoryItemNone = {
  type: HistoryTypeNone,
};

declare type HistoryItemFinish = {
  type: HistoryTypeFinish,
};

declare type HistoryItemFinishArgument = {
  type: HistoryTypeFinishArgument,
  value: any,
};

declare type HistoryItem
  = HistoryItemArgument
  | HistoryItemError
  | HistoryItemNone
  | HistoryItemFinish
  | HistoryItemFinishArgument;

declare type EffectTester = (...args: Array<any>) => Api;
declare type EffectTesterCreator = (value: any) => EffectTester;

declare type EffectTestersCreator = {
  actionChannel: EffectTesterCreator,
  apply: EffectTesterCreator,
  call: EffectTesterCreator,
  cancel: EffectTesterCreator,
  cancelled: EffectTesterCreator,
  cps: EffectTesterCreator,
  flush: EffectTesterCreator,
  fork: EffectTesterCreator,
  join: EffectTesterCreator,
  parallel: EffectTesterCreator,
  put: EffectTesterCreator,
  race: EffectTesterCreator,
  select: EffectTesterCreator,
  spawn: EffectTesterCreator,
  take: EffectTesterCreator,
  takem: EffectTesterCreator,
  takeEveryFork: EffectTesterCreator,
  takeLatestFork: EffectTesterCreator,
  throttleFork: EffectTesterCreator,
  takeEveryEffect: EffectTesterCreator,
  takeLatestEffect: EffectTesterCreator,
  throttleEffect: EffectTesterCreator,
  is: EffectTesterCreator,
  inspect: EffectTesterCreator,
  isDone: EffectTesterCreator,
  returns: EffectTesterCreator,
};

declare type TakePattern = string | Array<string> | Function;

declare type Effect = {
  '@@redux-saga/IO': true,
};

declare type TakePatternEffect = Effect & {
  TAKE: {
    pattern: TakePattern,
  },
};

declare type ForkEffect = Effect & {
  FORK: {
    context: ?mixed,
    fn: Function,
    args: Array<mixed>,
  },
};

declare type ActionChannelEffect = Effect & {
  ACTION_CHANNEL: {
    pattern: TakePattern,
    buffer: Object,
  },
};

declare type TakeChannelEffect = Effect & {
  TAKE: {
    channel: Object,
  },
};

declare type ThrottleCallEffect = Effect & {
  CALL: {
    context: ?mixed,
    fn: Function,
    args: Array<number>,
  },
};

// These are hacks to get validateTakeHelperEffects and
// validateThrottleHelperEffects to typecheck
declare type TakeHelperEffect
  = TakePatternEffect
  & ForkEffect;

declare type ThrottleHelperEffect
  = ActionChannelEffect
  & TakeChannelEffect
  & ForkEffect
  & ThrottleCallEffect;

declare type TakeHelperGenerator = Generator<?TakeHelperEffect, void, void> & {
  name?: string,
  '@@redux-saga/HELPER'?: true,
};

declare type ThrottleHelperGenerator = Generator<?ThrottleHelperEffect, void, void> & {
  name?: string,
  '@@redux-saga/HELPER'?: true,
};

// expectSaga

type Action = {
  type: string | Symbol,
};

type Reducer = (state: any, action: Action) => any;

type Timeout = number | false;

type TimeoutConfig = {
  silenceTimeout?: boolean,
  timeout?: Timeout,
};

type Task = { done: Promise<*> };

type Providers = {
  actionChannel?: Function,
  call?: Function,
  cancel?: Function,
  cancelled?: Function,
  cps?: Function,
  flush?: Function,
  fork?: Function,
  join?: Function,
  parallel?: Function,
  put?: Function,
  race?: Function,
  select?: Function,
  take?: Function,
};

type ExpectApi = {
  dispatch: Function,
  run: Function,
  provide: (Providers) => ExpectApi,
  withState: (any) => ExpectApi,
  withReducer: (Reducer, any) => ExpectApi,
  actionChannel: Function,
  apply: Function,
  call: Function,
  cps: Function,
  fork: Function,
  put: Function,
  race: Function,
  select: Function,
  spawn: Function,
  take: Function,
};
