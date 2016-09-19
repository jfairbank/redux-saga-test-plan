/* @flow */
/* eslint-disable no-use-before-define */

export type Api = {
  next: Progresser;
  finish: Progresser;
  back: Back;
  save: SaveRestore;
  restore: SaveRestore;
  restart: Restart;
  throw: ThrowError;
};

export type ApiWithEffectsTesters = Api & {
  actionChannel: EffectTester;
  apply: EffectTester;
  call: EffectTester;
  cancel: EffectTester;
  cancelled: EffectTester;
  cps: EffectTester;
  fork: EffectTester;
  join: EffectTester;
  parallel: EffectTester;
  put: EffectTester;
  race: EffectTester;
  select: EffectTester;
  spawn: EffectTester;
  take: EffectTester;
  takem: EffectTester;
  is: EffectTester;
  isDone: EffectTester;
  returns: EffectTester;
};

export type Progresser = (...args: Array<any>) => ApiWithEffectsTesters;
export type Back = (n: number | void) => Api;
export type SaveRestore = (s: string) => Api;
export type Restart = () => Api;
export type ThrowError = (error: Error) => ApiWithEffectsTesters;

export type ArgRegular = {
  type: 'ARGUMENT';
  value: any;
};

export type ArgError = {
  type: 'ERROR';
  value: any;
};

export type ArgNone = {
  type: 'NONE';
};

export type ArgFinish = {
  type: 'FINISH';
};

export type ArgFinishWithValue = {
  type: 'FINISH_ARGUMENT';
  value: any;
};

export type Arg = ArgRegular | ArgError | ArgNone | ArgFinish | ArgFinishWithValue;

export type EffectTester = (...args: Array<any>) => Api;
export type EffectTesterCreator = (value: any) => EffectTester;

export type EffectTestersCreator = {
  actionChannel: EffectTesterCreator;
  apply: EffectTesterCreator;
  call: EffectTesterCreator;
  cancel: EffectTesterCreator;
  cancelled: EffectTesterCreator;
  cps: EffectTesterCreator;
  fork: EffectTesterCreator;
  join: EffectTesterCreator;
  parallel: EffectTesterCreator;
  put: EffectTesterCreator;
  race: EffectTesterCreator;
  select: EffectTesterCreator;
  spawn: EffectTesterCreator;
  take: EffectTesterCreator;
  takem: EffectTesterCreator;
  is: EffectTesterCreator;
  isDone: EffectTesterCreator;
  returns: EffectTesterCreator;
};
