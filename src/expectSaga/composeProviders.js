// @flow
import { NEXT } from './provideValue';

export default function composeProviders(...providers: Array<Provider>): Provider {
  return (effect, next) => {
    for (let i = 0, l = providers.length; i < l; i++) {
      const provider = providers[i];
      const result = provider(effect, next);

      if (result !== NEXT) {
        return result;
      }
    }

    return NEXT;
  };
}
