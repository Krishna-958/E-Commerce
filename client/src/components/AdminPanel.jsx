import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import AppContext from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

  const emptyForm = { title: '', description: '', price: '', category: '', qty: '', imgSrc: '', isListed: true }

const AdminPanel = () => {
  const { url, token, user } = useContext(AppContext)
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/')
      return
    }
    fetchProducts()
  }, [user])

  const fetchProducts = async () => {
    const api = await axios.get(`${url}/admin/products`, {
      headers: { 'Content-Type': 'Application/json', Auth: token },
      withCredentials: true,
    })
    setProducts(api.data.products)
  }

  const toggle = async (id) => {
    await axios.put(`${url}/admin/product/toggle/${id}`, {}, {
      headers: { 'Content-Type': 'Application/json', Auth: token },
      withCredentials: true,
    })
    fetchProducts()
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const [errors, setErrors] = useState([])

  const submit = async (e) => {
    e.preventDefault()
    setErrors([])
    const validation = []
    if (!form.title || form.title.trim().length < 2) validation.push('Title is required (min 2 characters)')
    const priceNum = parseFloat(form.price)
    if (isNaN(priceNum) || priceNum <= 0) validation.push('Price must be a number greater than 0')
    const qtyNum = parseInt(form.qty)
    if (isNaN(qtyNum) || qtyNum < 0) validation.push('Qty must be 0 or greater')
    if (!form.imgSrc || form.imgSrc.trim().length === 0) validation.push('Image URL is required')

    if (validation.length) {
      setErrors(validation)
      return
    }

    const payload = {
      ...form,
      price: priceNum,
      qty: qtyNum,
    }

    if (editingId) {
      await axios.put(`${url}/admin/product/${editingId}`, payload, { headers: { 'Content-Type': 'Application/json', Auth: token }, withCredentials: true })
    } else {
      await axios.post(`${url}/admin/product`, payload, { headers: { 'Content-Type': 'Application/json', Auth: token }, withCredentials: true })
    }
    setForm(emptyForm)
    setEditingId(null)
    fetchProducts()
  }

  const edit = (p) => {
    setForm({ title: p.title, description: p.description, price: p.price, category: p.category, qty: p.qty, imgSrc: p.imgSrc, isListed: p.isListed })
    setEditingId(p._id)
  }

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return
    await axios.delete(`${url}/admin/product/${id}`, { headers: { 'Content-Type': 'Application/json', Auth: token }, withCredentials: true })
    fetchProducts()
  }

  return (
    <div className="container my-4">
      <h2>Admin Panel - Manage Products</h2>

      <div className="card p-3 my-3">
        <h4>{editingId ? 'Edit Product' : 'Add Product'}</h4>
        <form onSubmit={submit}>
          <div className="row">
            <div className="col-md-6 mb-2">
              <label className="form-label">Title <span style={{color:'red'}}>*</span></label>
              <input name="title" value={form.title} onChange={handleChange} className="form-control" placeholder="Product title (e.g. iPhone 14)" />
            </div>
            <div className="col-md-6 mb-2">
              <label className="form-label">Category</label>
              <input name="category" value={form.category} onChange={handleChange} className="form-control" placeholder="Category (e.g. mobiles)" />
            </div>
            <div className="col-md-4 mb-2">
              <label className="form-label">Price (INR) <span style={{color:'red'}}>*</span></label>
              <input name="price" value={form.price} onChange={handleChange} type="number" step="0.01" min="0" className="form-control" placeholder="Price (e.g. 19999.00)" />
            </div>
            <div className="col-md-4 mb-2">
              <label className="form-label">Quantity <span style={{color:'red'}}>*</span></label>
              <input name="qty" value={form.qty} onChange={handleChange} type="number" step="1" min="0" className="form-control" placeholder="Stock quantity (e.g. 10)" />
            </div>
            <div className="col-md-8 mb-2">
              <label className="form-label">Image URL <span style={{color:'red'}}>*</span></label>
              <input name="imgSrc" value={form.imgSrc} onChange={handleChange} className="form-control" placeholder="https://...jpg" />
            </div>
            <div className="col-md-4 mb-2">
              <label className="form-label">Preview</label>
              <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid #ddd',borderRadius:6,padding:6}}>
                {form.imgSrc ? <img src={form.imgSrc} alt="preview" style={{maxWidth:'100%',maxHeight:120,borderRadius:6}} onError={(e)=>{e.target.src='https://via.placeholder.com/150'}} /> : <div style={{color:'#666'}}>Image preview</div>}
              </div>
            </div>
            <div className="col-12 mb-2">
              <label className="form-label">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} className="form-control" placeholder="Short description of the product" />
            </div>
            <div className="col-12 mb-2">
              <label><input type="checkbox" name="isListed" checked={form.isListed} onChange={handleChange} /> Listed on website</label>
            </div>
            <div className="col-12">
              {errors.length > 0 && (
                <div className="alert alert-danger">
                  <ul className="mb-0">
                    {errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
              <button className="btn btn-success" type="submit">{editingId ? 'Update' : 'Add'}</button>
              {editingId && <button type="button" className="btn btn-secondary ms-2" onClick={() => { setEditingId(null); setForm(emptyForm) }}>Cancel</button>}
            </div>
          </div>
        </form>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Price</th>
            <th>Listed</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {products?.map(p => (
            <tr key={p._id}>
              <td>{p.title}</td>
              <td>{p.price}</td>
              <td>{p.isListed ? 'Yes' : 'No'}</td>
              <td>
                <button className="btn btn-sm btn-primary me-2" onClick={() => edit(p)}>Edit</button>
                <button className="btn btn-sm btn-warning me-2" onClick={() => toggle(p._id)}>{p.isListed ? 'Hide' : 'Show'}</button>
                <button className="btn btn-sm btn-danger" onClick={() => remove(p._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AdminPanel
