# Setup Instructions

## Prerequisites

Make sure you have Node.js (v18 or higher) and npm installed on your system.

## Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and set your `NEXTAUTH_SECRET`. You can generate a random secret using:
   ```bash
   openssl rand -base64 32
   ```
   Or use any random string generator.

3. **Set Up Database**
   
   Generate Prisma Client:
   ```bash
   npm run db:generate
   ```
   
   Push the schema to create the database:
   ```bash
   npm run db:push
   ```
   
   Or run a migration:
   ```bash
   npm run db:migrate
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

5. **Open the Application**
   
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Testing the Authentication

1. **Sign Up**
   - Go to `/signup` or click "Sign Up" on the home page
   - Enter your email, password (min 6 characters), and optionally your name
   - Click "Sign up"
   - You should be redirected to the login page

2. **Login**
   - Go to `/login` or click "Login" on the home page
   - Enter the email and password you just created
   - Click "Sign in"
   - You should be redirected to the dashboard

3. **Verify User in Database**
   
   You can use Prisma Studio to view your database:
   ```bash
   npm run db:studio
   ```
   
   This will open a browser interface where you can see all users in the database.

## Project Structure

```
athlete-recruitment-tool/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/route.ts  # NextAuth API route
│   │       └── signup/route.ts         # Signup API endpoint
│   ├── dashboard/
│   │   └── page.tsx                    # Protected dashboard page
│   ├── login/
│   │   └── page.tsx                    # Login page
│   ├── signup/
│   │   └── page.tsx                    # Signup page
│   ├── layout.tsx                      # Root layout
│   ├── page.tsx                        # Home page
│   └── globals.css                     # Global styles
├── components/
│   ├── LogoutButton.tsx                # Logout button component
│   └── providers.tsx                   # Session provider wrapper
├── lib/
│   ├── auth.ts                         # NextAuth configuration
│   ├── db.ts                           # Prisma client instance
│   └── utils.ts                        # Utility functions (password hashing)
├── prisma/
│   └── schema.prisma                   # Database schema
└── types/
    └── next-auth.d.ts                  # NextAuth type definitions
```

## Next Steps

After completing the setup and testing authentication:

1. The user model is ready in the database
2. Authentication flow is fully functional
3. You can now proceed with implementing profile management features
4. See `IMPLEMENTATION_PLAN.md` for the full roadmap

## Troubleshooting

- **Database errors**: Make sure you've run `npm run db:push` or `npm run db:migrate`
- **Authentication not working**: Check that `NEXTAUTH_SECRET` is set in your `.env` file
- **Type errors**: Run `npm run db:generate` to regenerate Prisma Client after schema changes
