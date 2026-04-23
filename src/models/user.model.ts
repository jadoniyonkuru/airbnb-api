export type Role = "host" | "guest";

export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  phone: string;
  role: Role;
  avatar?: string;
  bio?: string;
}

export let users: User[] = [
  { id: 1, name: "John Doe", email: "john@mail.com", username: "johndoe", phone: "1234567890", role: "host", bio: "Superhost with 5 years experience" },
  { id: 2, name: "Jane Smith", email: "jane@mail.com", username: "janesmith", phone: "0987654321", role: "guest" },
  { id: 3, name: "Alice Brown", email: "alice@mail.com", username: "aliceb", phone: "1122334455", role: "host", bio: "Love hosting travelers" }
];
