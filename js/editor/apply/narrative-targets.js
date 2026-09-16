'use strict';

/* Pure authoring compiler: explicit narrative identity -> world position.
 * No coordinate joins, order-based fallback, live GAME dependency or writes.
 * The generated binding is consumed by runtime and authoring tools alike.
 */
function compileTargets(registry, objects) {
  const fail = (message) => { throw new Error('Narrative targets: ' + message); };
  const record = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const id = (value) => typeof value === 'string' && /^[a-z][a-z0-9_]*$/.test(value);
  const keys = (value, allowed, label) => {
    if (!record(value) || Object.keys(value).some((key) => !allowed.includes(key))) fail(label + ' contains unknown fields');
  };
  keys(registry, ['version', 'targets'], 'registry');
  if (registry.version !== 1 || !Array.isArray(registry.targets)) fail('version 1 and targets[] required');
  if (!record(objects) || objects.version !== 1 || !record(objects.scenes)) fail('scene objects version 1 required');
  const result = {}, identities = new Set(), positions = new Set();
  for (const target of registry.targets) {
    keys(target, ['scene', 'id', 'kind', 'position', 'bind'], 'target');
    if (!id(target.scene) || !id(target.id)) fail('invalid scene or target id');
    if (!['object', 'landmark', 'sign'].includes(target.kind)) fail('invalid kind for ' + target.id);
    const identity = target.scene + '/' + target.id;
    if (identities.has(identity)) fail('duplicate identity ' + identity);
    identities.add(identity);
    if (!own(objects.scenes, target.scene)) fail('unknown scene ' + target.scene);
    if (own(target, 'position') === own(target, 'bind')) fail(identity + ' needs exactly one of position or bind');
    let x, y;
    if (own(target, 'position')) {
      keys(target.position, ['x', 'y'], identity + '.position');
      ({ x, y } = target.position);
    } else {
      keys(target.bind, ['interactId', 'objectId'], identity + '.bind');
      const bind = target.bind, scene = objects.scenes[target.scene];
      if (own(bind, 'interactId') === own(bind, 'objectId')) fail(identity + ' needs exactly one explicit binding');
      if (own(bind, 'interactId')) {
        if (typeof bind.interactId !== 'string' || !/^[A-Za-z][A-Za-z0-9_]*$/.test(bind.interactId)) fail(identity + ' has invalid interactId');
        const matches = Object.entries(scene.interact || {}).filter(([, value]) => value === bind.interactId);
        if (matches.length !== 1) fail(identity + ' binding ' + bind.interactId + ' resolves to ' + matches.length + ' entries (exactly one required)');
        if (!/^\d+,\d+$/.test(matches[0][0])) fail(identity + ' has malformed interact coordinates');
        [x, y] = matches[0][0].split(',').map(Number);
      } else {
        if (typeof bind.objectId !== 'string' || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(bind.objectId)) fail(identity + ' has invalid objectId');
        const matches = (scene.objects || []).filter((object) => object.sourceId === bind.objectId);
        if (matches.length !== 1) fail(identity + ' binding ' + bind.objectId + ' resolves to ' + matches.length + ' entries (exactly one required)');
        ({ x, y } = matches[0]);
      }
    }
    if (![x, y].every((n) => Number.isSafeInteger(n) && n >= 0)) fail(identity + ' coordinates must be non-negative safe integers');
    const position = target.scene + '/' + x + ',' + y;
    if (positions.has(position)) fail('ambiguous target position ' + position);
    positions.add(position);
    if (!own(result, target.scene)) result[target.scene] = {};
    result[target.scene][target.id] = { x, y, kind: target.kind };
  }
  return result;
}
module.exports = { compileTargets };
