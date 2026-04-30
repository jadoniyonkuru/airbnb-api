/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "a3f8c2d1-4b5e-4f6a-8c9d-1e2f3a4b5c6d"
 *         name:
 *           type: string
 *           example: John Host
 *         email:
 *           type: string
 *           example: john@mail.com
 *         username:
 *           type: string
 *           example: johnhost
 *         phone:
 *           type: string
 *           example: "0788000111"
 *         role:
 *           type: string
 *           enum: [HOST, GUEST, ADMIN]
 *           example: HOST
 *         avatar:
 *           type: string
 *           nullable: true
 *           example: https://res.cloudinary.com/demo/image/upload/sample.jpg
 *         bio:
 *           type: string
 *           nullable: true
 *           example: I love hosting guests
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-01-01T00:00:00.000Z"
 *
 *     Listing:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "a3f8c2d1-4b5e-4f6a-8c9d-1e2f3a4b5c6d"
 *         title:
 *           type: string
 *           example: Modern Apartment in Kigali
 *         description:
 *           type: string
 *           example: A beautiful modern apartment
 *         location:
 *           type: string
 *           example: Kigali, Rwanda
 *         pricePerNight:
 *           type: number
 *           example: 75
 *         guests:
 *           type: integer
 *           example: 2
 *         type:
 *           type: string
 *           enum: [APARTMENT, HOUSE, VILLA, CABIN]
 *           example: APARTMENT
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           example: ["WiFi", "AC", "Kitchen"]
 *         rating:
 *           type: number
 *           nullable: true
 *           example: 4.5
 *         hostId:
 *           type: string
 *           example: "a3f8c2d1-4b5e-4f6a-8c9d-1e2f3a4b5c6d"
 *         host:
 *           $ref: '#/components/schemas/User'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-01-01T00:00:00.000Z"
 *
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "a3f8c2d1-4b5e-4f6a-8c9d-1e2f3a4b5c6d"
 *         checkIn:
 *           type: string
 *           format: date-time
 *           example: "2026-06-01T00:00:00.000Z"
 *         checkOut:
 *           type: string
 *           format: date-time
 *           example: "2026-06-05T00:00:00.000Z"
 *         totalPrice:
 *           type: number
 *           example: 300
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED]
 *           example: PENDING
 *         guestId:
 *           type: string
 *           example: "a3f8c2d1-4b5e-4f6a-8c9d-1e2f3a4b5c6d"
 *         listingId:
 *           type: string
 *           example: "a3f8c2d1-4b5e-4f6a-8c9d-1e2f3a4b5c6d"
 *         guest:
 *           $ref: '#/components/schemas/User'
 *         listing:
 *           $ref: '#/components/schemas/Listing'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-01-01T00:00:00.000Z"
 *
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "a3f8c2d1-4b5e-4f6a-8c9d-1e2f3a4b5c6d"
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 5
 *         comment:
 *           type: string
 *           example: Amazing place to stay!
 *         userId:
 *           type: string
 *           example: "a3f8c2d1-4b5e-4f6a-8c9d-1e2f3a4b5c6d"
 *         listingId:
 *           type: string
 *           example: "a3f8c2d1-4b5e-4f6a-8c9d-1e2f3a4b5c6d"
 *         user:
 *           $ref: '#/components/schemas/User'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-01-01T00:00:00.000Z"
 *
 *     RegisterInput:
 *       type: object
 *       required: [name, email, username, phone, password, role]
 *       properties:
 *         name:
 *           type: string
 *           example: John Host
 *         email:
 *           type: string
 *           example: john@mail.com
 *         username:
 *           type: string
 *           example: johnhost
 *         phone:
 *           type: string
 *           example: "0788000111"
 *         password:
 *           type: string
 *           example: password123
 *         role:
 *           type: string
 *           enum: [HOST, GUEST]
 *           example: GUEST
 *
 *     LoginInput:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           example: john@mail.com
 *         password:
 *           type: string
 *           example: password123
 *
 *     CreateListingInput:
 *       type: object
 *       required: [title, description, location, pricePerNight, guests, type, amenities]
 *       properties:
 *         title:
 *           type: string
 *           example: Modern Apartment in Kigali
 *         description:
 *           type: string
 *           example: A beautiful modern apartment
 *         location:
 *           type: string
 *           example: Kigali, Rwanda
 *         pricePerNight:
 *           type: number
 *           example: 75
 *         guests:
 *           type: integer
 *           example: 2
 *         type:
 *           type: string
 *           enum: [APARTMENT, HOUSE, VILLA, CABIN]
 *           example: APARTMENT
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           example: ["WiFi", "AC", "Kitchen"]
 *
 *     CreateBookingInput:
 *       type: object
 *       required: [listingId, checkIn, checkOut]
 *       properties:
 *         listingId:
 *           type: string
 *           example: "a3f8c2d1-4b5e-4f6a-8c9d-1e2f3a4b5c6d"
 *         checkIn:
 *           type: string
 *           format: date-time
 *           example: "2026-06-01T00:00:00.000Z"
 *         checkOut:
 *           type: string
 *           format: date-time
 *           example: "2026-06-05T00:00:00.000Z"
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: Resource not found
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         user:
 *           $ref: '#/components/schemas/User'
 */

// This file only contains swagger schema definitions
export {};