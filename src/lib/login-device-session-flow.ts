let loginDeviceSessionFlowActive = false;

export function beginLoginDeviceSessionFlow() {
  loginDeviceSessionFlowActive = true;
}

export function endLoginDeviceSessionFlow() {
  loginDeviceSessionFlowActive = false;
}

export function isLoginDeviceSessionFlowActive(): boolean {
  return loginDeviceSessionFlowActive;
}
