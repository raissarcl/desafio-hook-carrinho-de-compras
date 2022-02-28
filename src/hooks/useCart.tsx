import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const stock: Stock = await api.get(`stock/${productId}`).then(res => res.data);
      let newCart = [...cart];
      let product = newCart.find(product => product.id === productId);

      if (!product) {
        const productFromProducts: Product = await api.get(`products/${productId}`).then(res => res.data);
        newCart = [...cart, { ...productFromProducts, amount: 1 }];
        product = productFromProducts;

        setCart([...newCart]);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        return;
      }

      if (product.amount + 1 > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      product.amount += 1;

      setCart([...newCart]);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {

      const newCart = [...cart];
      const product = newCart.find(product => product.id === productId);

      if (!product) {
        toast.error('Erro na remoção do produto');
        return;
      }

      newCart.splice(cart.indexOf(product), 1);

      setCart([...newCart]);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      const stock: Stock = await api.get(`stock/${productId}`).then(res => res.data);
      const newCart = [...cart];
      const product = newCart.find(product => product.id === productId);

      if (!product) {
        toast.error('Erro na remoção do produto');
        return;
      }

      if (stock.amount < amount || amount <= 0) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      product.amount = amount;

      setCart([...newCart]);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
