import serializeEffect from './serializeEffect';

export default function reportActualEffects(store, storeKey) {
  const values = store.values();

  if (values.length === 0) {
    return '';
  }

  const serializedEffects = values.map(
    (effect, i) => `${i + 1}. ${serializeEffect(effect, storeKey)}`,
  );

  return `\nActual:\n------\n${serializedEffects.join('\n')}\n`;
}
