import type { LocatorDefinition } from '../../ai/healing/selfHealingLocator';

type CheckoutSelectorKey =
  | 'checkoutButton'
  | 'firstName'
  | 'lastName'
  | 'zipCode'
  | 'continueButton'
  | 'finishButton'
  | 'confirmation';

export const checkoutSelectors: Record<CheckoutSelectorKey, LocatorDefinition> = {
  checkoutButton: {
    name: 'checkoutButton',
    primary: '#checkout',
    fallbacks: ['id=checkout', 'role=button=Checkout'],
  },
  firstName: {
    name: 'firstName',
    primary: '#first-name',
    fallbacks: ['id=first-name'],
  },
  lastName: {
    name: 'lastName',
    primary: '#last-name',
    fallbacks: ['id=last-name'],
  },
  zipCode: {
    name: 'zipCode',
    primary: '#postal-code',
    fallbacks: ['id=postal-code'],
  },
  continueButton: {
    name: 'continueButton',
    primary: '#continue',
    fallbacks: ['id=continue', 'role=button=Continue'],
  },
  finishButton: {
    name: 'finishButton',
    primary: '#finish',
    fallbacks: ['id=finish', 'role=button=Finish'],
  },
  confirmation: {
    name: 'confirmation',
    primary: '.complete-header',
    fallbacks: ['text=Thank you for your order!'],
  },
};
