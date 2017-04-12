# Mocking with Providers

Sometimes integration testing sagas can be laborious, especially when you have
to mock server APIs for `call` or create fake state and selectors to use with
`select`.

To make tests simpler, Redux Saga Test Plan allows you to intercept and handle
effect creators instead of letting Redux Saga handle them. This is similar to a
middleware layer that Redux Saga Test Plan calls _providers_.

To use providers, you can call the `provide` method. The `provide` method takes
one argument which can either be an array or an object literal.
