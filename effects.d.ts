import { Action } from 'redux';
import { Task, Channel, Buffer } from 'redux-saga';
import * as E from 'redux-saga/effects';

interface TakeEffectTester<R> {
    (pattern?: E.Pattern): R;
    <T>(channel: Channel<T>): R;
    maybe: TakeEffectTester<R>
}

interface EffectApi<R> {
    actionChannel(pattern: E.Pattern, buffer?: Buffer<any>): R;
    apply<T, K extends keyof T>(context: T, fnName: K, ...args: any[]): R;
    apply(context: any, fn: Function, ...args: any[]): R;
    cps(fn: Function, ...args: any[]): R,
    put<A extends Action>(action: A): R;
    race(effects: { [key: string]: E.Effect }): R;
    race(effects: E.Effect[]): R;
    select<S>(selector?: (state: S) => any, ...args: any[]): R;
    call<T>(fn: [T, Function], ...args: any[]): R;
    call<T, K extends keyof T>(fn: [T, K], ...args: any[]): R;
    call(fn: Function, ...args: any[]): R;
    fork(fn: Function, ...args: any[]): R;
    spawn(fn: Function, ...args: any[]): R;
    take: TakeEffectTester<R>
    all(effects: { [key: string]: E.Effect }): R;
    all(effects: E.Effect[]): R;
    cancel(task: Task): R;
    cancelled(): R;
    flush(channel: Channel<any>): R;
    join(...tasks: Task[]): R;
}

type Extract<T, K extends keyof T> = T[K]

type LikeEx<D, K extends keyof D, R> = {
    [Key in K]: (param: D[K]) => R;
} & { like(effect: Partial<D>): R; }

type ActionChannelEffectEx<R> =
    LikeEx<E.ActionChannelEffectDescriptor, 'pattern', R>
    & Extract<EffectApi<R>, 'actionChannel'>;

type ApplyEffectEx<R> =
    LikeEx<E.CallEffectDescriptor, 'fn', R>
    & Extract<EffectApi<R>, 'apply'>;

type CallEffectEx<R> =
    LikeEx<E.CallEffectDescriptor, 'fn', R>
    & Extract<EffectApi<R>, 'call'>;

type CpsEffectEx<R> =
    LikeEx<E.CallEffectDescriptor, 'fn', R>
    & Extract<EffectApi<R>, 'cps'>;

type ForkEffectEx<R> =
    LikeEx<E.CallEffectDescriptor, 'fn', R>
    & Extract<EffectApi<R>, 'fork'>;

type SelectEffectEx<R> =
    LikeEx<E.SelectEffectDescriptor, 'selector', R>
    & Extract<EffectApi<R>, 'select'>;

type SpawnEffectEx<R> =
    LikeEx<E.CallEffectDescriptor, 'fn', R>
    & Extract<EffectApi<R>, 'spawn'>;

type PutEffectEx<R> =
    Extract<EffectApi<R>, 'put'>
    & {
        like(effect: Partial<E.PutEffectDescriptor<any>>): R;
        // field name doesn't mach here :/ (actionType vs action)
        actionType(action: string): R;
        actionType<A extends Action>(action: A): R;
        resolve: PutEffectEx<R>
    }

interface EffectApiEx<R> {
    actionChannel: ActionChannelEffectEx<R>;
    apply: ApplyEffectEx<R>;
    cps: CpsEffectEx<R>;
    put: PutEffectEx<R>;
    select: SelectEffectEx<R>;
    call: CallEffectEx<R>;
    fork: ForkEffectEx<R>;
    spawn: SpawnEffectEx<R>;
}