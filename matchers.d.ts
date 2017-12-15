import { EffectApi, EffectApiEx } from './effects';

type Extract<T, K extends keyof T> = T[K]

export interface Matcher { }

export const actionChannel: Extract<EffectApiEx<Matcher>, 'actionChannel'>;
export const apply: Extract<EffectApiEx<Matcher>, 'apply'>;
export const call: Extract<EffectApiEx<Matcher>, 'call'>;
export const cancel: Extract<EffectApi<Matcher>, 'cancel'>;
export const cancelled: Extract<EffectApi<Matcher>, 'cancelled'>;
export const cps: Extract<EffectApiEx<Matcher>, 'cps'>;
export const flush: Extract<EffectApi<Matcher>, 'flush'>;
export const fork: Extract<EffectApiEx<Matcher>, 'fork'>;
export const join: Extract<EffectApi<Matcher>, 'join'>;
export const put: Extract<EffectApiEx<Matcher>, 'put'>;
export const race: Extract<EffectApi<Matcher>, 'race'>;
export const select: Extract<EffectApiEx<Matcher>, 'select'>;
export const spawn: Extract<EffectApiEx<Matcher>, 'spawn'>;
export const take: Extract<EffectApi<Matcher>, 'take'>;