export function updateAnimationMixers(objectsByName, delta) {
  for (const obj of objectsByName.values()) {
    const mixer = obj.userData?.animationMixer;
    if (mixer) {
      mixer.update(delta);
    }
  }
}

export function playAnimation(actions, animationName) {
  if (!actions) return false;

  for (const action of Object.values(actions)) {
    action.stop();
  }

  let nextAction = actions[animationName];

  if (!nextAction) {
    const found = Object.entries(actions).find(([key]) =>
      key.toLowerCase().includes(animationName.toLowerCase())
    );
    nextAction = found?.[1];
  }

  if (!nextAction) return false;

  nextAction.reset().play();
  return true;
}