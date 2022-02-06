import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'app-login-failed',
	templateUrl: './login-failed.page.html',
	styleUrls: ['./login-failed.page.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginFailedPage {}
