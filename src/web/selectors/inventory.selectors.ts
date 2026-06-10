import type { LocatorDefinition } from '../../ai/healing/selfHealingLocator';

type InventorySelectorKey = 'cartBadge' | 'cartLink';

export const inventorySelectors: Record<InventorySelectorKey, LocatorDefinition> = {
  cartBadge: {
    name: 'cartBadge',
    primary: '.shopping_cart_badge',
    fallbacks: ['a.shopping_cart_link .shopping_cart_badge'],
  },
  cartLink: {
    name: 'cartLink',
    primary: '.shopping_cart_link',
    fallbacks: ['a[data-test="shopping-cart-link"]'],
  },
};
