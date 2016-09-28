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
};

declare type ApiWithEffectsTesters = Api & {
  actionChannel: EffectTester,
  apply: EffectTester,
  call: EffectTester,
  cancel: EffectTester,
  cancelled: EffectTester,
  cps: EffectTester,
  fork: EffectTester,
  join: EffectTester,
  parallel: EffectTester,
  put: EffectTester,
  race: EffectTester,
  select: EffectTester,
  spawn: EffectTester,
  take: EffectTester,
  takem: EffectTester,
  is: EffectTester,
  isDone: EffectTester,
  returns: EffectTester,
};

declare type SavePoints = { [key: string]: Array<HistoryItem> };

declare type Progresser = (...args: Array<any>) => ApiWithEffectsTesters;
declare type Back = (n?: number) => Api;
declare type SaveRestore = (s: string) => Api;
declare type Restart = () => Api;
declare type ThrowError = (error: Error) => ApiWithEffectsTesters;

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
  fork: EffectTesterCreator,
  join: EffectTesterCreator,
  parallel: EffectTesterCreator,
  put: EffectTesterCreator,
  race: EffectTesterCreator,
  select: EffectTesterCreator,
  spawn: EffectTesterCreator,
  take: EffectTesterCreator,
  takem: EffectTesterCreator,
  is: EffectTesterCreator,
  isDone: EffectTesterCreator,
  returns: EffectTesterCreator,
};
