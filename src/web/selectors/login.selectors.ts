import type { LocatorDefinition } from '../../ai/healing/selfHealingLocator';

type LoginSelectorKey = 'usernameInput' | 'passwordInput' | 'loginButton' | 'inventoryContainer';

export const loginSelectors: Record<LoginSelectorKey, LocatorDefinition> = {
  usernameInput: {
    name: 'usernameInput',
    primary: '#user-name',
    fallbacks: ['id=user-name', 'input[data-test="username"]'],
  },
  passwordInput: {
    name: 'passwordInput',
    primary: '#password',
    fallbacks: ['id=password', 'input[data-test="password"]'],
  },
  loginButton: {
    name: 'loginButton',
    primary: '#login-button',
    fallbacks: ['id=login-button', 'role=button=Login'],
  },
  inventoryContainer: {
    name: 'inventoryContainer',
    primary: '.inventory_list',
    fallbacks: ['text=Products'],
  },
};
