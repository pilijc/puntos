let intentional = false;

export function markIntentionalSignOut() {
  intentional = true;
}

export function consumeIntentionalSignOut(): boolean {
  const v = intentional;
  intentional = false;
  return v;
}
