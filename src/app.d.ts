// See https://kit.svelte.dev/docs/types#app
declare global {
  namespace App {
    interface Locals {
      user: AuthUser | null;
    }
    interface PageData {
      user?: AuthUser | null;
    }
  }

  interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: string;
    img: string | null;
    username: string | null;
    description: string | null;
    instagram: string | null;
    facebook: string | null;
  }
}

export {};
