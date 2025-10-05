import express from 'express'
import { listAllProducts, toggleProductListing, listUsers, createProduct, updateProduct, deleteProduct } from '../Controllers/admin.js'
import { Authenticated } from '../Middlewares/auth.js'
import { isAdmin } from '../Middlewares/admin.js'

const router = express.Router();

router.get('/products', Authenticated, isAdmin, listAllProducts);
router.put('/product/toggle/:id', Authenticated, isAdmin, toggleProductListing);
router.get('/users', Authenticated, isAdmin, listUsers);
router.post('/product', Authenticated, isAdmin, createProduct);
router.put('/product/:id', Authenticated, isAdmin, updateProduct);
router.delete('/product/:id', Authenticated, isAdmin, deleteProduct);

export default router;

