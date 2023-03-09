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
     const storagedCart = localStorage.getItem('@RocketShoes:cart')

     if (storagedCart) {
       return JSON.parse(storagedCart);
     }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stock = await api.get<Stock>(`/stock/${productId}`)

      const existsInCart = cart.find((product) => product.id === productId)

      const stockAmount = stock.data.amount

      const currentAmount = existsInCart ? existsInCart.amount : 0

      if(currentAmount + 1 > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque')
        return;
      }

      if(existsInCart) {
        setCart(
          cart.map((product) => {
            if(product.id === productId) {
              return {...product, amount: product.amount + 1}
            }
            else {
              return product
            }
        }))
      }
      else {
        const product = await api.get<Product>(`/products/${productId}`)

        const newProduct = {
          ...product.data,
          amount: 1
        }

        setCart([...cart, newProduct])
      }

      const stringCart = JSON.stringify(cart)

      localStorage.setItem('@RocketShoes:cart', stringCart)

    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      setCart(cart.filter((product) => product.id !== productId))

      const stringCart = JSON.stringify(cart)

      localStorage.setItem('@RocketShoes:cart', stringCart)

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0) {
        return
      }

      const stock = await api.get<Stock>(`/stock/${productId}`)

      const stockAmount = stock.data.amount
      
      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      setCart(
        cart.map((product) => {
          if(product.id === productId) {
            return {...product, amount: amount}
          }
          else {
            return product
          }
      }))

      const stringCart = JSON.stringify(cart)

      localStorage.setItem('@RocketShoes:cart', stringCart)

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
