import {Task, Channel, SagaIterator} from 'redux-saga';
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

function testSaga(saga: (...params: any[]) => SagaIterator, ...params: any[]): ISagaTest;

export default testSaga;
