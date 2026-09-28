const prisma = require("../config/prisma");
const { randomUUID } = require("crypto");

const cartLineKey = (menuItemId, customizations, itemNotes) =>
  `${menuItemId}::${JSON.stringify(customizations || {})}::${itemNotes || ""}`;

const formatCartResponse = (cart) => {
  if (!cart) return { items: [], restaurant: null, restaurants: [] };
  const restaurantsMap = new Map();
  const items = (cart.items || []).map((ci) => {
    const rid = ci.menuItem?.restaurantId || cart.restaurantId;
    const rname = ci.menuItem?.restaurant?.name;
    if (rid && !restaurantsMap.has(rid)) {
      restaurantsMap.set(rid, {
        id: rid,
        name: rname || cart.restaurant?.name,
        imageUrl: ci.menuItem?.restaurant?.imageUrl || cart.restaurant?.imageUrl,
      });
    }
    return {
      id: ci.id,
      cartItemId: ci.id,
      menuItemId: ci.menuItemId,
      name: ci.menuItem?.name,
      price: ci.unitPrice ?? ci.menuItem?.price,
      imageUrl: ci.menuItem?.imageUrl,
      quantity: ci.quantity,
      customizations: ci.customizations,
      itemNotes: ci.itemNotes,
      lineKey: ci.lineKey,
      isVeg: ci.menuItem?.isVeg,
      restaurantId: rid,
      restaurantName: rname || cart.restaurant?.name,
    };
  });

  return {
    id: cart.id,
    restaurantId: cart.restaurantId,
    restaurant: cart.restaurant,
    restaurants: Array.from(restaurantsMap.values()),
    items,
  };
};

const cartInclude = {
  items: {
    include: {
      menuItem: {
        include: {
          restaurant: { select: { id: true, name: true, imageUrl: true } },
        },
      },
    },
  },
  restaurant: {
    select: {
      id: true,
      name: true,
      imageUrl: true,
      deliveryFee: true,
      minOrderAmount: true,
      maxItemQuantity: true,
      packagingFee: true,
      deliveryTime: true,
    },
  },
};

const getCart = async (req, res, next) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: cartInclude,
    });
    res.json({ cart: formatCartResponse(cart) });
  } catch (err) {
    next(err);
  }
};

const syncCart = async (req, res, next) => {
  try {
    const { restaurantId, items = [] } = req.body;

    if (!items.length) {
      let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
      if (cart) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        cart = await prisma.cart.update({
          where: { id: cart.id },
          data: { restaurantId: null },
          include: cartInclude,
        });
      }
      return res.json({ cart: formatCartResponse(cart) });
    }

    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      include: { restaurant: true },
    });
    if (menuItems.length !== new Set(menuItemIds).size) {
      return res.status(400).json({ message: "One or more menu items not found" });
    }

    const menuById = Object.fromEntries(menuItems.map((m) => [m.id, m]));
    for (const item of items) {
      const menuItem = menuById[item.menuItemId];
      const maxQty = menuItem.restaurant.maxItemQuantity ?? 10;
      if (item.quantity > maxQty) {
        return res.status(400).json({
          message: `Maximum ${maxQty} per item allowed for ${menuItem.restaurant.name}`,
        });
      }
    }

    const uniqueRestIds = [...new Set(menuItems.map((m) => m.restaurantId))];
    const primaryRestaurantId =
      uniqueRestIds.length === 1
        ? uniqueRestIds[0]
        : restaurantId && uniqueRestIds.includes(restaurantId)
          ? restaurantId
          : uniqueRestIds[0];

    let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user.id, restaurantId: primaryRestaurantId },
      });
    } else {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      cart = await prisma.cart.update({
        where: { id: cart.id },
        data: { restaurantId: primaryRestaurantId },
      });
    }

    for (const item of items) {
      const lineKey = item.lineKey || cartLineKey(item.menuItemId, item.customizations, item.itemNotes);
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice ?? item.price ?? menuById[item.menuItemId]?.price ?? null,
          customizations: item.customizations || null,
          itemNotes: item.itemNotes || null,
          lineKey,
        },
      });
    }

    const updated = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: cartInclude,
    });
    res.json({ cart: formatCartResponse(updated) });
  } catch (err) {
    next(err);
  }
};

const addItem = async (req, res, next) => {
  try {
    const { menuItemId, quantity = 1, unitPrice, customizations, itemNotes } = req.body;
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: { restaurant: true },
    });
    if (!menuItem) return res.status(404).json({ message: "Menu item not found" });

    const maxQty = menuItem.restaurant.maxItemQuantity ?? 10;
    if (quantity > maxQty) {
      return res.status(400).json({ message: `Maximum ${maxQty} per item allowed` });
    }

    let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });

    // Multi-restaurant: keep existing items; only set primary restaurantId if empty
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user.id, restaurantId: menuItem.restaurantId },
      });
    } else if (!cart.restaurantId) {
      cart = await prisma.cart.update({
        where: { id: cart.id },
        data: { restaurantId: menuItem.restaurantId },
      });
    }

    const lineKey = cartLineKey(menuItemId, customizations, itemNotes);
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_lineKey: { cartId: cart.id, lineKey } },
    });

    let cartItem;
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > maxQty) {
        return res.status(400).json({ message: `Maximum ${maxQty} per item allowed` });
      }
      cartItem = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
        include: { menuItem: true },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          menuItemId,
          quantity,
          unitPrice: unitPrice ?? menuItem.price,
          customizations: customizations || null,
          itemNotes: itemNotes || null,
          lineKey,
        },
        include: { menuItem: true },
      });
    }

    res.json({ cartItem });
  } catch (err) {
    next(err);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (quantity < 1) return res.status(400).json({ message: "Quantity must be at least 1" });

    const existing = await prisma.cartItem.findUnique({
      where: { id: req.params.cartItemId },
      include: { cart: { include: { restaurant: true } }, menuItem: { include: { restaurant: true } } },
    });
    if (!existing || existing.cart.userId !== req.user.id) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const maxQty = existing.menuItem.restaurant.maxItemQuantity ?? 10;
    if (quantity > maxQty) {
      return res.status(400).json({ message: `Maximum ${maxQty} per item allowed` });
    }

    const cartItem = await prisma.cartItem.update({
      where: { id: req.params.cartItemId },
      data: { quantity },
      include: { menuItem: true },
    });
    res.json({ cartItem });
  } catch (err) {
    next(err);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const existing = await prisma.cartItem.findUnique({
      where: { id: req.params.cartItemId },
      include: { cart: true },
    });
    if (!existing || existing.cart.userId !== req.user.id) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    await prisma.cartItem.delete({ where: { id: req.params.cartItemId } });
    res.json({ message: "Item removed from cart" });
  } catch (err) {
    next(err);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      await prisma.cart.update({ where: { id: cart.id }, data: { restaurantId: null } });
    }
    res.json({ message: "Cart cleared" });
  } catch (err) {
    next(err);
  }
};

const saveForLater = async (req, res, next) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            menuItem: { include: { restaurant: { select: { id: true, name: true } } } },
          },
        },
      },
    });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const items = cart.items.map((ci) => ({
      menuItemId: ci.menuItemId,
      name: ci.menuItem.name,
      price: ci.unitPrice ?? ci.menuItem.price,
      imageUrl: ci.menuItem.imageUrl,
      quantity: ci.quantity,
      customizations: ci.customizations,
      itemNotes: ci.itemNotes,
      lineKey: ci.lineKey,
      restaurantId: ci.menuItem.restaurantId,
      restaurantName: ci.menuItem.restaurant?.name,
    }));

    const uniqueRestIds = [...new Set(items.map((i) => i.restaurantId).filter(Boolean))];

    const saved = await prisma.savedCart.create({
      data: {
        id: randomUUID(),
        userId: req.user.id,
        restaurantId: uniqueRestIds.length === 1 ? uniqueRestIds[0] : cart.restaurantId,
        items,
      },
    });

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.update({ where: { id: cart.id }, data: { restaurantId: null } });

    res.json({ savedCart: saved, message: "Cart saved for later" });
  } catch (err) {
    next(err);
  }
};

const getSavedCarts = async (req, res, next) => {
  try {
    const savedCarts = await prisma.savedCart.findMany({
      where: { userId: req.user.id },
      orderBy: { savedAt: "desc" },
      take: 10,
    });
    res.json({ savedCarts });
  } catch (err) {
    next(err);
  }
};

const restoreSavedCart = async (req, res, next) => {
  try {
    const saved = await prisma.savedCart.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!saved) return res.status(404).json({ message: "Saved cart not found" });

    const items = Array.isArray(saved.items) ? saved.items : [];
    const restaurantId = saved.restaurantId || items[0]?.restaurantId;
    req.body = { restaurantId, items };
    return syncCart(req, res, next);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCart,
  syncCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  saveForLater,
  getSavedCarts,
  restoreSavedCart,
};
