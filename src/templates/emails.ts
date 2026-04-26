export function welcomeEmail(name: string, role: string): string {
  const roleMessage =
    role === "HOST"
      ? `<p>You're registered as a <strong>Host</strong>. Start by creating your first listing and welcoming guests from around the world!</p>
         <a href="http://localhost:3000/listings" style="background:#FF5A5F;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
           Create Your First Listing
         </a>`
      : `<p>You're registered as a <strong>Guest</strong>. Start exploring amazing listings and book your next stay!</p>
         <a href="http://localhost:3000/listings" style="background:#FF5A5F;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
           Explore Listings
         </a>`;

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h1 style="color:#FF5A5F;">Welcome to Airbnb, ${name}!</h1>
      <p>Your account has been created successfully.</p>
      ${roleMessage}
    </div>
  `;
}

export function bookingConfirmationEmail(
  guestName: string,
  listingTitle: string,
  location: string,
  checkIn: string,
  checkOut: string,
  totalPrice: number
): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h1 style="color:#FF5A5F;">Booking Confirmed!</h1>
      <p>Hi ${guestName}, your booking has been confirmed.</p>
      <div style="background:#f7f7f7;padding:20px;border-radius:8px;margin:20px 0;">
        <h2>${listingTitle}</h2>
        <p> <strong>Location:</strong> ${location}</p>
        <p> <strong>Check-in:</strong> ${checkIn}</p>
        <p> <strong>Check-out:</strong> ${checkOut}</p>
        <p> <strong>Total Price:</strong> $${totalPrice}</p>
      </div>
      <p style="color:#999;font-size:12px;">
        Cancellation policy: You can cancel your booking up to 24 hours before check-in for a full refund.
      </p>
    </div>
  `;
}

export function bookingCancellationEmail(
  guestName: string,
  listingTitle: string,
  checkIn: string,
  checkOut: string
): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h1 style="color:#FF5A5F;">Booking Cancelled</h1>
      <p>Hi ${guestName}, your booking has been cancelled.</p>
      <div style="background:#f7f7f7;padding:20px;border-radius:8px;margin:20px 0;">
        <h2>${listingTitle}</h2>
        <p> <strong>Check-in:</strong> ${checkIn}</p>
        <p>strong>Check-out:</strong> ${checkOut}</p>
      </div>
      <p>We hope to see you again soon! Find another great listing below.</p>
      <a href="http://localhost:3000/listings" style="background:#FF5A5F;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
        Explore Listings
      </a>
    </div>
  `;
}

export function passwordResetEmail(name: string, resetLink: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h1 style="color:#FF5A5F;">Password Reset Request</h1>
      <p>Hi ${name}, we received a request to reset your password.</p>
      <p>Click the button below to reset it. This link expires in <strong>1 hour</strong>.</p>
      <a href="${resetLink}" style="background:#FF5A5F;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
        Reset Password
      </a>
      <p style="color:#999;font-size:12px;margin-top:20px;">
        If you did not request this, ignore this email. Your password will not change.
      </p>
    </div>
  `;
}