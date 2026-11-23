import React, { createContext, useContext, useState } from 'react';

export const MENU_ITEMS = {
  tower_burger: {
    id: 'tower_burger',
    name: 'Tower Burger',
    price: 500,
    image: '/static/tower_burger.png',
    desc: 'Charcoal-seared double beef patty, melted aged cheddar, crisp greens, pickles, and signature burger sauce on toasted sesame brioche.',
  },
  paratha_roll: {
    id: 'paratha_roll',
    name: 'Chicken Paratha Roll',
    price: 350,
    image: '/static/paratha_roll.png',
    desc: 'Flaky golden-crisped paratha wrapped around smoky chargrilled chicken tikka, pickled red onions, and signature mint-garlic crema.',
  },
};

const INITIAL_REVIEWS = [
  {
    name: 'Ali',
    stars: 5,
    text: 'The Tower Burger after midnight is unbeatable. That smoky charcoal sear and warm buttered brioche hit different every single time.',
  },
  {
    name: 'Abdullah',
    stars: 5,
    text: 'Ordered the Chicken Paratha Roll with friends — flaky, juicy, and packed with spice. Easily the best late-night cafe vibe around.',
  },
  {
    name: 'Umer',
    stars: 5,
    text: 'Dark charcoal aesthetic, super smooth service, and the signature sauce on the burger is pure perfection. My regular weekend stop.',
  },
  {
    name: 'Ahmed',
    stars: 5,
    text: 'Fast order confirmation and piping hot delivery. Waqar Foodies never compromises on ingredient freshness.',
  },
  {
    name: 'Junaid',
    stars: 5,
    text: 'From the first bite to the last crumb, you can taste the craft. Top marks for both the Tower Burger and Paratha Roll.',
  },
];

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [cart, setCart] = useState({});
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState(null);
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [introDone, setIntroDone] = useState(false);
  const [savedCustomer, setSavedCustomer] = useState(() => {
    try {
      const raw = sessionStorage.getItem('wf_saved_customer');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  function addToCart(itemId, qty = 1) {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + qty }));
  }

  function updateQty(itemId, delta) {
    setCart((prev) => {
      const nextQty = (prev[itemId] || 0) + delta;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: nextQty };
    });
  }

  function clearCart() {
    setCart({});
  }

  function saveCustomerSession(details) {
    setSavedCustomer(details);
    try {
      if (details) {
        sessionStorage.setItem('wf_saved_customer', JSON.stringify(details));
      } else {
        sessionStorage.removeItem('wf_saved_customer');
      }
    } catch {
      // Ignore storage errors
    }
  }

  function addLiveReview(review) {
    setReviews((prev) => [review, ...prev].slice(0, 20));
  }

  const cartItems = Object.entries(cart)
    .filter(([id, qty]) => MENU_ITEMS[id] && qty > 0)
    .map(([id, qty]) => ({ ...MENU_ITEMS[id], qty }));

  const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const grandTotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <AppContext.Provider
      value={{
        cartItems,
        totalQty,
        grandTotal,
        addToCart,
        updateQty,
        clearCart,
        isBagOpen,
        setIsBagOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        confirmedOrderId,
        setConfirmedOrderId,
        savedCustomer,
        saveCustomerSession,
        reviews,
        addLiveReview,
        introDone,
        setIntroDone,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
