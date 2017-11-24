import {Action} from 'redux';
import {Task} from 'redux-saga';
import {Channel} from 'redux-saga';
import {SagaIterator} from 'redux-saga';

export interface ISagaTest {
    back(steps?: number): ISagaTest;

    next(param?: any): ISagaTest;

    select(selector: Function, ...args: any[]): ISagaTest;

    take(actionType: string | string[] | Channel<any>): ISagaTest;

    takeEvery(actionType: string | Channel<any>, saga: Function, ...args: any[]): ISagaTest;

    takeEveryFork(actionType: string | Channel<any>, saga: Function, ...args: any[]): ISagaTest;

    put(action: Action): ISagaTest;

    is(expectation: any): ISagaTest;

    call(fn: Function, ...args: any[]): ISagaTest;

    returns(returnValue: any): ISagaTest;

    delay(time: number): ISagaTest;

    cancel(task: Task): ISagaTest;

    cancelled(): ISagaTest;

    fork(fn: Function, ...args: any[]): ISagaTest;

    parallel(handlers: Function[]): ISagaTest;

    throw(error: Error): ISagaTest;

    isDone(): ISagaTest;

    finish(): ISagaTest;
}

export interface IExpectSaga {
    put(action: Action): IExpectSaga;

    take(action: Action): IExpectSaga;

    call(fn: Function, ...args: any[]): IExpectSaga;

    withReducer(...args: any[]): IExpectSaga;

    hasFinalState(...args: any[]): IExpectSaga;

    provide(...args: any[]): IExpectSaga;

    dispatch(action: Action): IExpectSaga;

    returns(...args: any[]): IExpectSaga;

    run(): Promise<void>;
}

export type SagaType = (...params: any[]) => SagaIterator;

export function expectSaga(saga: SagaType, ...params: any[]): IExpectSaga;

export function testSaga(saga: SagaType, ...params: any[]): ISagaTest;