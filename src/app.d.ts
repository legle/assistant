/// <reference types="@sveltejs/kit" />
import type { PrismaClient } from "@prisma/client";

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			auth: {
				validate: () => Promise<{
					id: string;
					userId: string;
					expires: Date;
					user: {
						id: string;
						email: string;
						name: string;
						emailVerified: Date | null;
						image: string | null;
						isAdmin: boolean;
					};
				} | null>;
			};
			db: PrismaClient;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
