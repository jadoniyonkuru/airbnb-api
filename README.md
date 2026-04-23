# Airbnb REST API

A simplified Airbnb-like REST API built with Node.js, Express, and TypeScript.

## Tech Stack
- Node.js
- Express
- TypeScript
- TSX

## Getting Started

### Install dependencies
npm install

### Run the server
npm run dev

## API Endpoints

### Users
| Method | Endpoint      | Description        |
|--------|---------------|--------------------|
| GET    | /users        | Get all users      |
| GET    | /users/:id    | Get user by ID     |
| POST   | /users        | Create a new user  |
| PUT    | /users/:id    | Update a user      |
| DELETE | /users/:id    | Delete a user      |

### Listings
| Method | Endpoint         | Description           |
|--------|------------------|-----------------------|
| GET    | /listings        | Get all listings      |
| GET    | /listings/:id    | Get listing by ID     |
| POST   | /listings        | Create a new listing  |
| PUT    | /listings/:id    | Update a listing      |
| DELETE | /listings/:id    | Delete a listing      |
