import type { LocatorDefinition } from '../../ai/healing/selfHealingLocator';

type InventorySelectorKey = 'cartBadge' | 'cartLink';

export function addToCartButton(productName: string): LocatorDefinition {
  const slug = productName.trim().toLowerCase().replace(/\s+/g, '-');

  return {
    name: `addToCart:${slug}`,
    primary: `[data-test="add-to-cart-${slug}"]`,
    fallbacks: [`#add-to-cart-${slug}`, `.inventory_item:has-text("${productName}") button`],
  };
}

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
