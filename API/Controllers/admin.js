import { Products } from "../Models/Product.js";
import { User } from "../Models/User.js";

export const listAllProducts = async (req, res) => {
  try {
    const products = await Products.find().sort({ createdAt: -1 });
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleProductListing = async (req, res) => {
  const id = req.params.id;
  try {
    const product = await Products.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    product.isListed = !product.isListed;
    await product.save();
    res.json({ message: "Product listing updated", product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { title, description, price, category, qty, imgSrc, isListed } = req.body;
    const product = await Products.create({ title, description, price, category, qty, imgSrc, isListed });
    res.status(201).json({ message: 'Product created', product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Products.findByIdAndUpdate(id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product updated', product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Products.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted', product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

