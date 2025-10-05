import React, { useContext, useEffect, useState } from "react";
import AppContext from "../context/AppContext";
import axios from "axios";
import TableProduct from "./TableProduct";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
  const { cart, userAddress, url, user, clearCart } = useContext(AppContext);
  const [qty, setQty] = useState(0);
  const [price, setPrice] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let qty = 0;
    let price = 0;
    if (cart?.items) {
      for (let i = 0; i < cart.items?.length; i++) {
        qty += cart.items[i].qty;
        price += cart.items[i].price;
      }
    }
    setPrice(price);
    setQty(qty);
  }, [cart]);

  const handlePayment = async () => {
    try {
      const orderRepons = await axios.post(`${url}/payment/checkout`, {
        amount: price,
        qty: qty,
        cartItems: cart?.items,
        userShipping: userAddress,
        userId: user._id,
      });

      console.log(" order response ", orderRepons);
      const { orderId, amount: orderAmount, order, key } = orderRepons.data;

      const amountPaise = (order?.amount || Math.round(orderAmount * 100));

      var options = {
        key: key || "rzp_test_gHH711O4gcSjCq", // prefer backend-provided key
        amount: amountPaise, // amount in paise
        currency: "INR",
        name: user?.name || "MERN E - Commerce",
        description: "Purchase from MERN E - Commerce",

        order_id: orderId || (order && order.id), // pass the order id
        handler: async function (response) {
          const paymentData = {
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            amount: orderAmount,
            orderItems: cart?.items,
            userId: user._id,
            userShipping: userAddress,
          };

          const api = await axios.post(
            `${url}/payment/verify-payment`,
            paymentData
          );

          console.log("razorpay res ", api.data);

          if (api.data.success) {
            clearCart();
            navigate("/oderconfirmation");
          }
        },
        prefill: {
          name: user?.name || userAddress?.fullName || "",
          email: user?.email || "",
          contact: userAddress?.phoneNumber || "",
        },
        notes: {
          address: "Vijay Nagar Indore",
        },
        theme: {
          color: "#3399cc",
        },
      };
      console.log('Razorpay options', options)

      // Basic validation before opening Razorpay
      if (!options.key) {
        console.error('Payment aborted: missing Razorpay key in checkout response', orderRepons.data)
        alert('Payment not possible: payment gateway not configured. Contact admin.');
        return;
      }
      if (!options.order_id) {
        console.error('Payment aborted: missing order_id in checkout response', orderRepons.data)
        alert('Payment not possible: order not created correctly. Try again.');
        return;
      }
      if (!options.amount || options.amount <= 0) {
        console.error('Payment aborted: invalid amount in checkout response', orderRepons.data)
        alert('Payment not possible: invalid order amount.');
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <div className="container  my-3">
        <h1 className="text-center">Order Summary</h1>

        <table className="table table-bordered border-primary bg-dark">
          <thead className="bg-dark">
            <tr>
              <th scope="col" className="bg-dark text-light text-center">
                Product Details
              </th>

              <th scope="col" className="bg-dark text-light text-center">
                Shipping Address
              </th>
            </tr>
          </thead>
          <tbody className="bg-dark">
            <tr>
              <td className="bg-dark text-light">
                <TableProduct cart={cart} />
              </td>
              <td className="bg-dark text-light">
                <ul style={{ fontWeight: "bold" }}>
                  <li>Name : {userAddress?.fullName}</li>
                  <li>Phone : {userAddress?.phoneNumber}</li>
                  <li>Country : {userAddress?.country}</li>
                  <li>State : {userAddress?.state}</li>
                  <li>PinCode : {userAddress?.pincode}</li>
                  <li>Near By : {userAddress?.address}</li>
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="container text-center my-5">
        <button
          className="btn btn-secondary btn-lg"
          style={{ fontWeight: "bold" }}
          onClick={handlePayment}
        >
          Procced To Pay
        </button>
      </div>

      {/* Fallback Razorpay.me link removed per request. For UPI testing use live Razorpay account with merchant VPA or test cards in test mode. */}
    </>
  );
};

export default Checkout;
