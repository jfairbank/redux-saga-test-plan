// @flow
export default function extractSagaHelperEffectName(name: string): string {
  return name.replace(/^(\w+)\(.*$/, '$1');
}
