// Lemon Squeezy license validation for Arcadia Toolbar
// Validates license keys against the Lemon Squeezy public API

import { requestUrl } from 'obsidian';

export interface LicenseStatus {
	valid: boolean;
	instanceId?: string;
	customerEmail?: string;
	expiresAt?: string;
	/** Last time a validation was attempted (success or failure). */
	lastChecked: number;
	/** Last time the server confirmed the key as valid. */
	lastValidated?: number;
}

/** Revalidate against the server at most once per day. */
export const LICENSE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * How long a previously confirmed license stays active when the license
 * server cannot be reached. Prevents locking paying users out while offline.
 */
export const OFFLINE_GRACE_PERIOD = 30 * 24 * 60 * 60 * 1000; // 30 days

export type LicenseCheckResult =
	| { outcome: 'valid'; status: LicenseStatus }
	| { outcome: 'invalid'; message: string }
	| { outcome: 'offline'; message: string };

/** Shape of the Lemon Squeezy license validate response (only the fields read here). */
interface LemonSqueezyValidateResponse {
	valid?: boolean;
	error?: string | null;
	instance?: { id?: string } | null;
	meta?: { customer_email?: string } | null;
	license_key?: { expires_at?: string | null } | null;
}

export async function validateLicense(licenseKey: string, instanceName = 'obsidian'): Promise<LicenseCheckResult> {
	try {
		const response = await requestUrl({
			url: 'https://api.lemonsqueezy.com/v1/licenses/validate',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: JSON.stringify({ license_key: licenseKey, instance_name: instanceName }),
			throw: false,
		});

		let data: LemonSqueezyValidateResponse | null = null;
		try {
			data = response.json as LemonSqueezyValidateResponse;
		} catch {
			data = null;
		}

		if (data && data.valid === true) {
			const now = Date.now();
			return {
				outcome: 'valid',
				status: {
					valid: true,
					instanceId: data.instance?.id,
					customerEmail: data.meta?.customer_email,
					expiresAt: data.license_key?.expires_at ?? undefined,
					lastChecked: now,
					lastValidated: now,
				},
			};
		}

		if (response.status >= 500) {
			return { outcome: 'offline', message: `License server error (${response.status}). Try again later.` };
		}

		const serverMsg = data && typeof data.error === 'string' ? data.error : 'License key is invalid or expired.';
		return { outcome: 'invalid', message: serverMsg };
	} catch {
		return {
			outcome: 'offline',
			message: 'Could not reach the license server. Check your internet connection and try again.',
		};
	}
}

/** True if a stored status was confirmed valid recently enough to skip a server round trip. */
export function isCacheValid(status: LicenseStatus): boolean {
	const reference = status.lastValidated ?? status.lastChecked;
	return Date.now() - reference < LICENSE_CACHE_DURATION;
}

/**
 * True if a stored status counts as an active license, including the offline
 * grace period after the last successful server validation.
 */
export function hasActiveLicense(status: LicenseStatus | null | undefined): boolean {
	if (!status || !status.valid) return false;
	const reference = status.lastValidated ?? status.lastChecked;
	return Date.now() - reference < OFFLINE_GRACE_PERIOD;
}
