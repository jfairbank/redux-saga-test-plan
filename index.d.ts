import {
    Task,
    Channel,
    SagaIterator,
} from 'redux-saga';
import {Action} from 'redux';

export interface ISagaTest {
    back(steps?: number): ISagaTest;

    next(param?: any): ISagaTest;

    select(selector: Function, ...args: any[]): ISagaTest;

    take(actionType: string | string[] | Channel<any>): ISagaTest;

    takeEvery(actionType: string | Channel<any>, saga: Function, ...args: any[]): ISagaTest;

    takeLatest(actionType: string | Channel<any>, saga: Function, ...args: any[]): ISagaTest;

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
    put(...params: any): IExpectSaga;

    withReducer(...params: any): IExpectSaga;

    hasFinalState(...params: any): IExpectSaga;

    take(...params: any): IExpectSaga;

    provide(...params: any): IExpectSaga;

    dispatch(...params: any): IExpectSaga;

    run(...params: any): IExpectSaga;
}

export type SagaType = (...params: any[]) => SagaIterator;

function testSaga(saga: SagaType, ...params: any[]): ISagaTest;

export function expectSaga(saga: SagaType): IExpectSaga;

export default testSaga;