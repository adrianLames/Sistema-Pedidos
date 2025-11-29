import React, { createContext, useContext, useState, useCallback } from 'react';

const ProductContext = createContext();

export const useProductContext = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const apiBase = process.env.REACT_APP_API_BASE;
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/products/get_all.php`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Manejar tanto formato de array directo como objeto con propiedad data
        const productsArray = Array.isArray(data) ? data : (data.data || []);
        setProducts(productsArray);
      }
    } catch (error) {
      // Puedes agregar notificaciones si lo deseas
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ProductContext.Provider value={{ products, setProducts, loadProducts, loading }}>
      {children}
    </ProductContext.Provider>
  );
};
