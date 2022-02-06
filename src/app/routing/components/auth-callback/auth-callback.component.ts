import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { AuthCallbackService } from '../../../core/services/authentication/auth-callback.service';

@Component({
	selector: 'app-auth-callback',
	template: '',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthCallbackComponent implements OnInit {
	constructor(private readonly authCallbackService: AuthCallbackService) {}

	async ngOnInit() {
		const urlParams = new URLSearchParams(location.search);
		await this.authCallbackService.handleAuthResponse(urlParams);
	}
}
