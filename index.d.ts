import { Action, Reducer } from 'redux';
import { SagaIterator } from 'redux-saga';
import * as E from 'redux-saga/effects';

import { Matcher } from './matchers';
import { EffectProviders, StaticProvider } from './providers';
import { EffectApi, EffectApiEx } from './effects'

type Timeout = number | false;

type TimeoutConfig = {
    silenceTimeout?: boolean,
    timeout?: Timeout,
};

export type ExpectApiEffects
    = Pick<EffectApi<ExpectApi>, 'getContext' | 'setContext' | 'race' | 'take'>
    & Pick<EffectApiEx<ExpectApi>, 'actionChannel' | 'apply' | 'call' | 'cps' | 'fork' | 'put' | 'select' | 'spawn'>;

interface RunResult {
    storeState: any;
    returnValue: any;
    allEffects: E.Effect[];
    effects: {
        take: E.TakeEffect[];
        put: E.PutEffect<any>[];
        race: E.RaceEffect[];
        call: E.CallEffect[];
        cps: E.CpsEffect[];
        fork: E.ForkEffect[];
        getContext: E.GetContextEffect[];
        select: E.SelectEffect[];
        setContext: E.SetContextEffect<any>[];
        actionChannel: E.ActionChannelEffect[];
    };
    toJSON(): Object;
}

export interface ExpectApi extends ExpectApiEffects {
    /** default timeout 250ms */
    run(timeout?: Timeout | TimeoutConfig): Promise<RunResult>;
    /** default timeout 250ms */
    silentRun(timeout?: Timeout | TimeoutConfig): Promise<RunResult>;
    provide(newProviders: EffectProviders): ExpectApi;
    provide(newProviders: (EffectProviders | StaticProvider)[]): ExpectApi;
    withState<S>(state: S): ExpectApi;
    withReducer<S>(newReducer: Reducer<S>, initialState?: S): ExpectApi;
    hasFinalState<S>(state: S): ExpectApi;
    returns(value: any): ExpectApi;
    delay(time: number): ExpectApi;
    dispatch<A extends Action>(action: A): ExpectApi;
    not: ExpectApi;
}

export type TakeHelperProgresser = (
    pattern: E.Pattern,
    saga: Function,
    ...args: any[]
) => TestApi;

export type ThrottleHelperProgresser = (
    delayTime: number,
    pattern: E.Pattern,
    saga: Function,
    ...args: any[]
) => TestApi;


export type TestApiEffects = Pick<
    EffectApi<TestApi>,
    'actionChannel' | 'apply' | 'cps' | 'getContext' | 'put' | 'race' | 'select' | 'call' | 'fork'
    | 'setContext' | 'spawn' | 'take' | 'all' | 'cancel' | 'cancelled' | 'flush' | 'join'>;

export interface TestApi {
    next(...args: any[]): TestApiWithEffectsTesters;
    finish(...args: any[]): TestApiWithEffectsTesters;
    back(n?: number): TestApi;
    save(s: string): TestApi;
    restore(s: string): TestApi;
    restart(): TestApi;
    throw(error: Error): TestApiWithEffectsTesters;
    takeEvery: TakeHelperProgresser;
    takeLatest: TakeHelperProgresser;
    throttle: ThrottleHelperProgresser;
}

export type TestApiWithEffectsTesters = TestApi & TestApiEffects & {
    /** deprecated */
    takeEveryFork(action: E.Pattern, fn: Function, ...args: any[]): TestApi;
    /** deprecated */
    takeLatestFork(action: E.Pattern, fn: Function, ...args: any[]): TestApi;
    /** deprecated */
    throttleFork(ms: number, action: E.Pattern, fn: Function, ...args: any[]): TestApi;
    takeEveryEffect(action: E.Pattern, fn: Function, ...args: any[]): TestApi;
    takeLatestEffect(action: E.Pattern, fn: Function, ...args: any[]): TestApi;
    throttleEffect(ms: number, action: E.Pattern, fn: Function, ...args: any[]): TestApi;
    is<V>(expectation: V): TestApi;
    inspect<V>(expectation: (yieldedValue: V) => void): TestApi;
    isDone(): TestApi;
    returns<V>(returnValue: V): TestApi;
};

export type SagaType = (...params: any[]) => SagaIterator | IterableIterator<any>;

export interface ExpectSaga {
    (generator: SagaType, ...sagaArgs: any[]): ExpectApi;
    DEFAULT_TIMEOUT: number;
}

export const expectSaga: ExpectSaga;
export const testSaga: (saga: SagaType, ...params: any[]) => TestApi;
