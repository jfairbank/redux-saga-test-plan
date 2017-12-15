import * as E from 'redux-saga/effects';
import { Matcher } from './matchers';

type ProviderNext = Object;
type ProviderNextF = () => ProviderNext;

export type StaticProvider = [E.Effect | Matcher, any]

export type EffectProvider<EffectDescriptor>
    = (effect: EffectDescriptor, next: ProviderNextF) => any;

export type EffectProviders = {
    actionChannel?: EffectProvider<E.ActionChannelEffectDescriptor>;
    all?: EffectProvider<E.AllEffectDescriptor>;
    call?: EffectProvider<E.CallEffectDescriptor>;
    cancel?: EffectProvider<E.CancelEffectDescriptor>;
    cancelled?: EffectProvider<E.CancelledEffectDescriptor>;
    cps?: EffectProvider<E.CallEffectDescriptor>;
    flush?: EffectProvider<E.FlushEffectDescriptor<any>>;
    fork?: EffectProvider<E.ForkEffectDescriptor>;
    join?: EffectProvider<E.JoinEffectDescriptor>;
    put?: EffectProvider<E.PutEffectDescriptor<any>>;
    race?: EffectProvider<E.RaceEffectDescriptor>;
    select?: EffectProvider<E.SelectEffectDescriptor>;
    spawn?: EffectProvider<E.CallEffectDescriptor>;
    take?: EffectProvider<E.TakeEffectDescriptor & E.ChannelTakeEffectDescriptor<any>>;
}

export const composeProviders: Function
export function dynamic<D = any>(effect: EffectProvider<D>): any
export function throwError(error: Error): any