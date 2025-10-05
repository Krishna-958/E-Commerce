Admin Panel added

How to create the admin user (seed):

1) From the backend project root run:

   npm install
   npm run seed:admin

This will create or update the admin user with:

email: krishna@gmail.com
password: 123456

Notes:
- The seed script uses the same MongoDB connection as `server.js`. Make sure your DB credentials are correct in `server.js` or change `scripts/seedAdmin.js`.
- After seeding, start the backend (`npm run start` or `node server.js`) and the frontend. Log in with the admin credentials, then the Navbar will show an "Admin" button that links to `/admin`.

Admin features:
- View all products (including hidden ones)
- Toggle a product's public listing (isListed)

Security reminder:
- Move DB credentials and JWT secrets into environment variables for production. Do not commit secrets.
